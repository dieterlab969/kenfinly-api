<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PayosPaymentOrder;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PayOS\PayOS;

/**
 * Handles PayOS hosted checkout payment links and async webhook processing.
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
     * Create a PayOS payment link for the selected plan.
     *
     * POST /api/payment/payos/create
     * Body: { "plan": "monthly"|"yearly" }
     *
     * Returns: { "checkout_url": "https://pay.payos.vn/..." }
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
                'amount'     => $planConf['amount'],
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
     * POST /api/payment/payos-webhook  (excluded from CSRF)
     *
     * PayOS sends a signed payload; we verify the signature with PAYOS_CHECKSUM_KEY
     * before trusting the data and updating the user's subscription.
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
        $code      = $verifiedData->code ?? null;

        if (! $orderCode) {
            return response()->json(['message' => 'Missing order code'], 400);
        }

        $order = PayosPaymentOrder::where('order_code', $orderCode)->first();

        if (! $order) {
            Log::channel('single')->warning('PayOS webhook: order not found', ['order_code' => $orderCode]);
            return response()->json(['message' => 'Order not found'], 404);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed'], 200);
        }

        if ($code === '00') {
            $this->activateSubscription($order->user, $order->plan);

            $order->update([
                'status'         => 'completed',
                'payos_response' => $verifiedData,
            ]);

            Log::channel('single')->info('PayOS webhook: subscription activated', [
                'user_id'    => $order->user_id,
                'plan'       => $order->plan,
                'order_code' => $orderCode,
            ]);
        } else {
            $order->update([
                'status'         => 'failed',
                'payos_response' => $verifiedData,
            ]);

            Log::channel('single')->info('PayOS webhook: payment not successful', [
                'order_code' => $orderCode,
                'code'       => $code,
            ]);
        }

        return response()->json(['message' => 'Webhook processed']);
    }

    /**
     * Activate the user's subscription for the given plan.
     */
    private function activateSubscription(User $user, string $plan): void
    {
        $now    = now();
        $expiry = $plan === 'yearly' ? $now->copy()->addYear() : $now->copy()->addMonth();

        $user->update([
            'subscription_status'   => 'active',
            'subscription_plan'     => $plan,
            'subscription_expires_at' => $expiry,
        ]);
    }
}
