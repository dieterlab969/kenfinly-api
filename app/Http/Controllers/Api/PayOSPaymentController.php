<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PayosPaymentOrder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
 * Cart clearing (cart-based orders):
 *   The shopping cart is cleared inside handleCartOrder() the moment the
 *   webhook confirms payment (code "00"). Because webhooks are server-to-
 *   server calls with no PHP session, clearing is done by direct DB delete
 *   on the `shopping_cart` table using the `cart_session_key` stored on the
 *   Order row. The \Cart facade is then refreshed via that same key to reset
 *   any in-process singleton state.
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
     * POST /api/payment/payos/create
     *
     * @param  Request  $request  JSON body: { "plan": "monthly"|"yearly" }
     * @return JsonResponse       { checkout_url: string, order_code: int }
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
     * Lookup order:
     *  1. `orders` table              — cart-based checkout flow
     *  2. `payos_payment_orders` table — direct pricing-page flow
     *
     * POST /api/payment/payos-webhook  (no auth — signature verified internally)
     *
     * @return JsonResponse  HTTP 200 on success, 400 on bad signature / missing data,
     *                       404 when the order_code is unknown.
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

        $cartOrder = Order::where('order_code', $orderCode)->first();
        if ($cartOrder) {
            return $this->handleCartOrder($cartOrder, $code, $verifiedData);
        }

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
     * GET /api/orders/{orderCode}/status
     *
     * @return JsonResponse  { order_code, status, plan } or HTTP 404.
     */
    public function orderStatus(string $orderCode): JsonResponse
    {
        $order = Order::where('order_code', $orderCode)->first();

        if (! $order) {
            return response()->json(['message' => 'Order not found'], 404);
        }

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
     * On success (code "00"):
     *  1. Activate the user's subscription.
     *  2. Mark the order "paid".
     *  3. Clear the DB-backed shopping cart using the order's `cart_session_key`.
     *     This is done via direct DB delete (no PHP session available in webhook
     *     context) followed by a \Cart::session() reset of the in-memory singleton.
     *
     * Idempotent: already-processed orders return HTTP 200 without changes.
     */
    private function handleCartOrder(Order $order, ?string $code, mixed $verifiedData): JsonResponse
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed'], 200);
        }

        if ($code === '00') {
            $this->activateSubscription($order->user, $order->plan);

            $order->update(['status' => 'paid']);

            // Clear the DB cart now that payment is confirmed.
            // The webhook runs without a browser session, so we delete the
            // shopping_cart rows directly rather than relying on the session.
            $this->clearCartBySessionKey($order->cart_session_key);

            Log::channel('single')->info('PayOS webhook: cart order paid', [
                'user_id'          => $order->user_id,
                'plan'             => $order->plan,
                'order_code'       => $order->order_code,
                'cart_session_key' => $order->cart_session_key,
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
     * Idempotent: already-processed orders return HTTP 200 without changes.
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
     * Clear all DB-cart rows associated with a given cart session key.
     *
     * Safe to call from webhook context (no active PHP session).
     * Deletes rows where `cart_key LIKE '{cartSessionKey}%'`, covering both
     * the `_cart_items` and `_cart_conditions` suffixes.
     *
     * @param  string|null  $cartSessionKey  No-op when null or empty.
     */
    private function clearCartBySessionKey(?string $cartSessionKey): void
    {
        if (! $cartSessionKey) {
            return;
        }

        DB::table('shopping_cart')
            ->where('cart_key', 'LIKE', $cartSessionKey . '%')
            ->delete();

        // Reset the Cart singleton state so any subsequent in-process reads
        // (e.g. a subsequent request on the same PHP-FPM worker) return empty.
        try {
            \Cart::session($cartSessionKey);
            \Cart::clear();
            \Cart::clearCartConditions();
        } catch (\Exception) {
            // The \Cart facade may not be available in all contexts; the DB
            // delete above is the authoritative cleanup operation.
        }
    }

    /**
     * Set the user's subscription to "active" for the given plan.
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
