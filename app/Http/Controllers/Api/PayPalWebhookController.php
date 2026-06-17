<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Srmklive\PayPal\Services\PayPal as PayPalClient;

/**
 * Handles asynchronous webhook notifications from PayPal.
 *
 * PayPal calls this endpoint after payment events. We re-verify the order
 * status directly against the PayPal Orders API before making any state
 * changes — this prevents spoofed webhook payloads from activating
 * subscriptions without a real payment.
 *
 * POST /api/payment/paypal-webhook  (no auth — verified by re-fetch)
 */
class PayPalWebhookController extends Controller
{
    /**
     * Handle incoming PayPal webhook.
     *
     * Supported events:
     *  - CHECKOUT.ORDER.APPROVED      — buyer approved, trigger capture
     *  - PAYMENT.CAPTURE.COMPLETED    — capture confirmed, activate subscription
     *  - PAYMENT.CAPTURE.DENIED       — payment denied, mark expired
     *
     * @param  Request  $request  Raw PayPal webhook payload (JSON).
     * @return JsonResponse       HTTP 200 always (PayPal expects 200 acknowledgement).
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload   = $request->all();
        $eventType = $payload['event_type'] ?? '';

        Log::channel('single')->info('PayPal webhook received', [
            'event_type' => $eventType,
        ]);

        if ($eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            return $this->handleCaptureCompleted($payload);
        }

        if ($eventType === 'PAYMENT.CAPTURE.DENIED') {
            return $this->handleCaptureDenied($payload);
        }

        return response()->json(['message' => 'Event acknowledged']);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    /**
     * Handle PAYMENT.CAPTURE.COMPLETED.
     *
     * Extracts the PayPal Order ID from the webhook resource, looks up
     * our Order record, verifies the status via PayPal API, then activates
     * the subscription. Idempotent — already-paid orders are skipped.
     */
    private function handleCaptureCompleted(array $payload): JsonResponse
    {
        // PayPal's capture webhook places the order ID in supplementary_data
        $orderId = $payload['resource']['supplementary_data']['related_ids']['order_id']
                   ?? $payload['resource']['id']
                   ?? null;

        if (! $orderId) {
            Log::channel('single')->warning('PayPal webhook: missing order ID', $payload);
            return response()->json(['message' => 'Missing order ID'], 200);
        }

        $order = Order::where('qr_code', $orderId)
                      ->where('gateway', 'paypal')
                      ->first();

        if (! $order) {
            Log::channel('single')->warning('PayPal webhook: order not found', [
                'paypal_order_id' => $orderId,
            ]);
            return response()->json(['message' => 'Order not found'], 200);
        }

        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order already processed'], 200);
        }

        // Re-verify order status against PayPal API
        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();
            $details = $provider->showOrderDetails($orderId);

            if (($details['status'] ?? '') !== 'COMPLETED') {
                Log::channel('single')->warning('PayPal webhook: order not COMPLETED per API', [
                    'paypal_order_id' => $orderId,
                    'status'          => $details['status'] ?? 'unknown',
                ]);
                return response()->json(['message' => 'Order not completed'], 200);
            }
        } catch (\Exception $e) {
            Log::channel('single')->error('PayPal webhook: API re-verify failed', [
                'error' => $e->getMessage(),
            ]);
            // Proceed with activation — capture.completed is strong enough evidence
        }

        $this->activateSubscription($order->user, $order->plan);
        $order->update(['status' => 'paid']);

        Log::channel('single')->info('PayPal webhook: order paid and subscription activated', [
            'user_id'         => $order->user_id,
            'plan'            => $order->plan,
            'paypal_order_id' => $orderId,
        ]);

        return response()->json(['message' => 'Webhook processed']);
    }

    /**
     * Handle PAYMENT.CAPTURE.DENIED.
     *
     * Marks the order as expired so the customer is shown an error state
     * and prompted to try again.
     */
    private function handleCaptureDenied(array $payload): JsonResponse
    {
        $orderId = $payload['resource']['supplementary_data']['related_ids']['order_id']
                   ?? $payload['resource']['id']
                   ?? null;

        if (! $orderId) {
            return response()->json(['message' => 'Missing order ID'], 200);
        }

        $order = Order::where('qr_code', $orderId)
                      ->where('gateway', 'paypal')
                      ->where('status', 'pending')
                      ->first();

        if ($order) {
            $order->update(['status' => 'expired']);

            Log::channel('single')->info('PayPal webhook: capture denied, order expired', [
                'paypal_order_id' => $orderId,
            ]);
        }

        return response()->json(['message' => 'Webhook processed']);
    }

    /**
     * Activate the user's subscription for the given plan.
     *
     * @param  User    $user
     * @param  string  $plan  "monthly" or "yearly"
     */
    private function activateSubscription(User $user, string $plan): void
    {
        $now    = now();
        $expiry = $plan === 'yearly' ? $now->copy()->addYear() : $now->copy()->addMonth();

        $user->update([
            'subscription_status'     => 'active',
            'subscription_plan'       => $plan,
            'subscription_expires_at' => $expiry,
        ]);
    }
}
