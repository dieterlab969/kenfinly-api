<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PayosPaymentOrder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PayOS\PayOS;

/**
 * Handles PayOS hosted checkout payment links and async webhook processing.
 *
 * Two order sources are supported:
 *  - orders              (cart-based checkout via CheckoutController)
 *  - payos_payment_orders (direct "Buy Now" from pricing page)
 *
 * Webhook signature verification is performed by the PayOS PHP SDK using
 * the PAYOS_CHECKSUM_KEY environment variable. Any payload whose HMAC does
 * not match is rejected with HTTP 400.
 *
 * @tags PayOS Payments
 */
class PayOSPaymentController extends Controller
{
    /**
     * Register middleware: only the payment-link creation endpoint requires
     * an authenticated API user. The webhook and order-status endpoints are
     * intentionally unauthenticated (called by PayOS servers / polling JS).
     */
    public function __construct()
    {
        $this->middleware('auth:api')->only(['createPaymentLink']);
    }

    /**
     * Create a PayOS payment link for the selected plan (direct pricing-page flow).
     *
     * Validates the requested plan, calls the PayOS SDK to generate a hosted
     * checkout URL, records a `payos_payment_orders` row with status "pending",
     * and returns the checkout URL to the React frontend.
     *
     * POST /api/payment/payos/create
     *
     * @param  Request  $request  JSON body: { "plan": "monthly"|"yearly" }
     * @return JsonResponse       { checkout_url: string, order_code: int }
     *                            or HTTP 500 on PayOS SDK failure.
     */
    public function createPaymentLink(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan' => 'required|in:monthly,yearly',
        ]);

        $plan     = $validated['plan'];
        $planConf = config("payos.plans.{$plan}");
        $user     = auth()->user();

        $orderCode = (int) (time() . rand(100, 999));

        $payOS = new PayOS(
            config('payos.client_id'),
            config('payos.api_key'),
            config('payos.checksum_key')
        );

        try {
            $response = $payOS->createPaymentLink([
                'orderCode'   => $orderCode,
                'amount'      => $planConf['amount'],
                'description' => $planConf['description'],
                'returnUrl'   => config('payos.return_url'),
                'cancelUrl'   => config('payos.cancel_url'),
                'buyerName'   => $user->name,
                'buyerEmail'  => $user->email,
            ]);

            PayosPaymentOrder::create([
                'user_id'    => $user->id,
                'order_code' => $orderCode,
                'plan'       => $plan,
                'amount'     => $planConf['amount'],
                'status'     => 'pending',
            ]);

            Log::channel('single')->info('PayOS payment link created', [
                'user_id'    => $user->id,
                'order_code' => $orderCode,
                'plan'       => $plan,
            ]);

            return response()->json([
                'checkout_url' => $response->checkoutUrl,
                'order_code'   => $orderCode,
            ]);
        } catch (\Exception $e) {
            Log::channel('single')->error('PayOS createPaymentLink failed', [
                'user_id' => $user->id,
                'plan'    => $plan,
                'error'   => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to create payment link. Please try again.',
            ], 500);
        }
    }

    /**
     * Handle asynchronous webhook notifications from PayOS.
     *
     * PayOS calls this endpoint after a payment attempt completes (success or
     * failure). The payload is verified via HMAC checksum before any state
     * changes are made. Lookup order:
     *  1. `orders` table              — cart-based checkout flow
     *  2. `payos_payment_orders` table — direct pricing-page flow
     *
     * POST /api/payment/payos-webhook  (no auth — signature verified internally)
     *
     * @param  Request  $request  Raw PayOS webhook payload.
     * @return JsonResponse       HTTP 200 on success, 400 on bad signature / missing data,
     *                            404 when the order_code is unknown.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        $payOS = new PayOS(
            config('payos.client_id'),
            config('payos.api_key'),
            config('payos.checksum_key')
        );

        try {
            $verifiedData = $payOS->verifyPaymentWebhookData($payload);
        } catch (\Exception $e) {
            Log::channel('single')->warning('PayOS webhook signature verification failed', [
                'error'   => $e->getMessage(),
                'payload' => $payload,
            ]);

            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $orderCode = $verifiedData->orderCode ?? null;
        $code      = $verifiedData->code      ?? null;

        if (! $orderCode) {
            return response()->json(['message' => 'Missing order code'], 400);
        }

        // ── 1. Try cart-based orders table first ──────────────────────────
        $cartOrder = Order::where('order_code', $orderCode)->first();
        if ($cartOrder) {
            return $this->handleCartOrder($cartOrder, $code, $verifiedData);
        }

        // ── 2. Fall back to direct pricing-page orders ─────────────────────
        $directOrder = PayosPaymentOrder::where('order_code', $orderCode)->first();
        if ($directOrder) {
            return $this->handleDirectOrder($directOrder, $code, $verifiedData);
        }

        Log::channel('single')->warning('PayOS webhook: order not found in either table', [
            'order_code' => $orderCode,
        ]);

        return response()->json(['message' => 'Order not found'], 404);
    }

    /**
     * Return the current status of a cart-based order (polled by the order page JS).
     *
     * Also performs lazy expiry: if the order is still "pending" but its
     * `expires_at` has passed, it is flipped to "expired" on this read.
     *
     * GET /api/orders/{orderCode}/status
     *
     * @param  string  $orderCode  Numeric order code cast from the URL segment.
     * @return JsonResponse        { order_code, status, plan } or HTTP 404.
     */
    public function orderStatus(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        // Auto-expire on read if the timer has passed
        if ($order->status === 'pending' && $order->isExpired()) {
            $order->update(['status' => 'expired']);
        }

        return response()->json([
            'order_code' => $order->order_code,
            'status'     => $order->status,
            'plan'       => $order->plan,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Process a verified PayOS webhook for a cart-based order.
     *
     * Marks the order "paid" and activates the user's subscription when
     * PayOS returns code "00" (success). Any other code marks the order
     * "expired" (cancelled / timed out on the PayOS side).
     * Idempotent: already-processed orders return HTTP 200 without changes.
     *
     * @param  Order        $order        The matched cart order.
     * @param  string|null  $code         PayOS result code ("00" = success).
     * @param  mixed        $verifiedData Full verified webhook payload object.
     * @return JsonResponse               HTTP 200 with a status message.
     */
    private function handleCartOrder(Order $order, ?string $code, mixed $verifiedData): JsonResponse
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed'], 200);
        }

        if ($code === '00') {
            $this->activateSubscription($order->user, $order->plan);

            $order->update(['status' => 'paid']);

            Log::channel('single')->info('PayOS webhook: cart order paid', [
                'user_id'    => $order->user_id,
                'plan'       => $order->plan,
                'order_code' => $order->order_code,
            ]);
        } else {
            $order->update(['status' => 'expired']);

            Log::channel('single')->info('PayOS webhook: cart order not successful', [
                'order_code' => $order->order_code,
                'code'       => $code,
            ]);
        }

        return response()->json(['message' => 'Webhook processed']);
    }

    /**
     * Process a verified PayOS webhook for a direct pricing-page order.
     *
     * On success (code "00") the user's subscription is activated and the
     * order row is updated to "completed" with the full verified response
     * stored for audit purposes. On failure the row is set to "failed".
     * Idempotent: already-processed orders return HTTP 200 without changes.
     *
     * @param  PayosPaymentOrder  $order        The matched direct payment order.
     * @param  string|null        $code         PayOS result code ("00" = success).
     * @param  mixed              $verifiedData Full verified webhook payload object.
     * @return JsonResponse                     HTTP 200 with a status message.
     */
    private function handleDirectOrder(PayosPaymentOrder $order, ?string $code, mixed $verifiedData): JsonResponse
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed'], 200);
        }

        if ($code === '00') {
            $this->activateSubscription($order->user, $order->plan);

            $order->update([
                'status'         => 'completed',
                'payos_response' => $verifiedData,
            ]);

            Log::channel('single')->info('PayOS webhook: direct order paid', [
                'user_id'    => $order->user_id,
                'plan'       => $order->plan,
                'order_code' => $order->order_code,
            ]);
        } else {
            $order->update([
                'status'         => 'failed',
                'payos_response' => $verifiedData,
            ]);
        }

        return response()->json(['message' => 'Webhook processed']);
    }

    /**
     * Set the user's subscription to "active" for the given plan.
     *
     * Calculates the expiry date from the current moment:
     *  - monthly → +1 month
     *  - yearly  → +1 year
     *
     * @param  User    $user  The user whose subscription should be activated.
     * @param  string  $plan  "monthly" or "yearly".
     * @return void
     */
    private function activateSubscription(User $user, string $plan): void
    {
        $now    = now();
        $expiry = $plan === 'yearly' ? $now->copy()->addYear() : $now->copy()->addMonth();

        $user->update([
            'subscription_status'    => 'active',
            'subscription_plan'      => $plan,
            'subscription_expires_at'=> $expiry,
        ]);
    }
}
