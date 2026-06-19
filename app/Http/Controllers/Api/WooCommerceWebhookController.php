<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPremiumActivation;
use App\Models\ProcessedPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Consumes WooCommerce "order.payment_complete" webhook events.
 *
 * Architecture
 * ────────────
 * WordPress + WooCommerce owns the full checkout experience (cart, coupons,
 * PayPal, Google Pay, order emails). This controller is the *only* entry
 * point through which WooCommerce notifies Kenfinly that a payment succeeded.
 *
 * Endpoint
 * ────────
 * POST /api/v1/woocommerce-callback
 *
 * Security
 * ────────
 * The VerifyWooCommerceSignature middleware validates the
 * X-WC-Webhook-Signature HMAC before this controller is ever reached.
 * No business logic runs on an unverified payload.
 *
 * Idempotency
 * ───────────
 * WooCommerce automatically retries webhook deliveries that receive anything
 * other than a 2xx response. The processed_payments table holds a UNIQUE
 * index on external_order_id. If a replay arrives the handler detects it
 * in O(1) and returns 200 immediately — preventing double-activations.
 *
 * Async processing
 * ────────────────
 * The actual subscription upgrade is handed off to ProcessPremiumActivation
 * (a queued job). This keeps the endpoint response time under ~50ms even
 * at 5,000+ daily visitors and ensures subscription activation is retried
 * automatically if the DB is briefly unavailable.
 *
 * Expected JSON payload
 * ─────────────────────
 * {
 *   "user_id":        42,
 *   "plan_type":      "monthly_pro",   // or "yearly_pro"
 *   "woo_order_id":   "WC-12345",
 *   "payment_method": "paypal"         // optional, e.g. 'paypal', 'google_pay'
 * }
 */
class WooCommerceWebhookController extends Controller
{
    /**
     * Handle an incoming WooCommerce payment-complete webhook.
     *
     * @param  Request      $request  Pre-verified by VerifyWooCommerceSignature.
     * @return JsonResponse
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->json()->all();

        // ── 1. Extract and validate required fields ───────────────────────
        $userId        = $payload['user_id']       ?? null;
        $planType      = $payload['plan_type']      ?? null;
        $wooOrderId    = (string) ($payload['woo_order_id'] ?? '');
        $paymentMethod = (string) ($payload['payment_method'] ?? 'unknown');

        if (!$userId || !$planType || $wooOrderId === '') {
            Log::warning('WooCommerce webhook: payload missing required fields', [
                'received_keys' => array_keys($payload),
                'ip'            => $request->ip(),
            ]);

            return response()->json(['error' => 'Missing required fields: user_id, plan_type, woo_order_id.'], 422);
        }

        // ── 2. Idempotency check ──────────────────────────────────────────
        // Return 200 immediately so WooCommerce stops retrying this delivery.
        if (ProcessedPayment::where('external_order_id', $wooOrderId)->exists()) {
            Log::info('WooCommerce webhook: duplicate event — already processed, skipping', [
                'woo_order_id' => $wooOrderId,
            ]);

            return response()->json(['status' => 'already_processed'], 200);
        }

        // ── 3. Record the payment (idempotency lock) ──────────────────────
        // Insert before dispatching the job. If the job fails and is retried,
        // step 2 prevents a second activation from being dispatched.
        ProcessedPayment::create([
            'external_order_id' => $wooOrderId,
            'payment_method'    => $paymentMethod,
        ]);

        Log::info('WooCommerce webhook: new payment recorded', [
            'user_id'        => $userId,
            'plan_type'      => $planType,
            'woo_order_id'   => $wooOrderId,
            'payment_method' => $paymentMethod,
        ]);

        // ── 4. Dispatch background job ────────────────────────────────────
        ProcessPremiumActivation::dispatch(
            (int) $userId,
            $planType,
            $wooOrderId,
        );

        return response()->json(['status' => 'queued'], 200);
    }
}
