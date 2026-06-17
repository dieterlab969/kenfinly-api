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
 * @tags PayOS Payments
 */
class PayOSPaymentController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api')->only(['createPaymentLink']);
    }

    /**
     * Create a PayOS payment link for the selected plan (direct pricing-page flow).
     *
     * POST /api/payment/payos/create
     * Body: { "plan": "monthly"|"yearly" }
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
     * POST /api/payment/payos-webhook  (no auth — signature verified internally)
     *
     * Lookup priority:
     *  1. orders table              (cart-based flow)
     *  2. payos_payment_orders table (direct pricing-page flow)
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
     * Return the status of a cart-based order (polled by the order page JS).
     *
     * GET /api/orders/{orderCode}/status
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
