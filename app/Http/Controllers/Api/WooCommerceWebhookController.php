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
 * Logging
 * ───────
 * Every request — successful, duplicate, or malformed — is written to the
 * dedicated `woocommerce` log channel (storage/logs/woocommerce-webhook.log).
 * Each entry includes request headers, full payload, response status, and
 * wall-clock execution time so issues can be diagnosed from logs alone.
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
        $startTime = microtime(true);

        // ── 0. Structured request capture ─────────────────────────────────
        // Log every inbound request before any processing so nothing is ever
        // lost — even payloads that fail validation are preserved for audit.
        $this->logIncomingRequest($request);

        $payload = $request->json()->all();

        // ── 1. Extract and validate required fields ───────────────────────
        $userId        = $payload['user_id']       ?? null;
        $planType      = $payload['plan_type']      ?? null;
        $wooOrderId    = (string) ($payload['woo_order_id'] ?? '');
        $paymentMethod = (string) ($payload['payment_method'] ?? 'unknown');

        if (!$userId || !$planType || $wooOrderId === '') {
            Log::channel('woocommerce')->warning('Payload missing required fields', [
                'received_keys'    => array_keys($payload),
                'ip'               => $request->ip(),
                'execution_ms'     => $this->elapsedMs($startTime),
                'response_status'  => 422,
            ]);

            return $this->respond(
                ['error' => 'Missing required fields: user_id, plan_type, woo_order_id.'],
                422,
                $startTime,
            );
        }

        // ── 2. Idempotency check ──────────────────────────────────────────
        // Return 200 immediately so WooCommerce stops retrying this delivery.
        if (ProcessedPayment::where('external_order_id', $wooOrderId)->exists()) {
            Log::channel('woocommerce')->info('Duplicate event — already processed, skipping', [
                'woo_order_id'    => $wooOrderId,
                'response_status' => 200,
                'execution_ms'    => $this->elapsedMs($startTime),
            ]);

            return $this->respond(['status' => 'already_processed'], 200, $startTime);
        }

        // ── 3. Record the payment (idempotency lock) ──────────────────────
        // Insert before dispatching the job. If the job fails and is retried,
        // step 2 prevents a second activation from being dispatched.
        ProcessedPayment::create([
            'external_order_id' => $wooOrderId,
            'payment_method'    => $paymentMethod,
        ]);

        Log::channel('woocommerce')->info('New payment recorded', [
            'user_id'        => $userId,
            'plan_type'      => $planType,
            'woo_order_id'   => $wooOrderId,
            'payment_method' => $paymentMethod,
        ]);

        // ── 4. Dispatch background job ────────────────────────────────────
        try {
            ProcessPremiumActivation::dispatch(
                (int) $userId,
                $planType,
                $wooOrderId,
            );
        } catch (\Throwable $e) {
            Log::channel('woocommerce')->error('Failed to dispatch ProcessPremiumActivation job', [
                'user_id'      => $userId,
                'woo_order_id' => $wooOrderId,
                'error'        => $e->getMessage(),
                'trace'        => $e->getTraceAsString(),
            ]);

            return $this->respond(
                ['error' => 'Internal error — payment recorded but activation job failed to queue.'],
                500,
                $startTime,
            );
        }

        return $this->respond(['status' => 'queued'], 200, $startTime);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Write a structured log entry for the raw inbound request.
     *
     * Captures: all request headers, full JSON body, client IP, User-Agent,
     * and the WC signature header value (truncated for readability).
     */
    private function logIncomingRequest(Request $request): void
    {
        $signature = $request->header('X-WC-Webhook-Signature', '');

        Log::channel('woocommerce')->debug('Incoming webhook request', [
            'ip'          => $request->ip(),
            'method'      => $request->method(),
            'path'        => $request->path(),
            'user_agent'  => $request->userAgent(),
            'signature'   => $signature ? substr($signature, 0, 16) . '…' : null,
            'headers'     => collect($request->headers->all())
                ->except(['authorization', 'cookie', 'x-wc-webhook-signature'])
                ->toArray(),
            'payload'     => $request->json()->all(),
        ]);
    }

    /**
     * Build a JSON response and log the final outcome (status + execution time).
     */
    private function respond(array $body, int $status, float $startTime): JsonResponse
    {
        Log::channel('woocommerce')->debug('Webhook response dispatched', [
            'response_status' => $status,
            'execution_ms'    => $this->elapsedMs($startTime),
        ]);

        return response()->json($body, $status);
    }

    /** Wall-clock milliseconds since $startTime. */
    private function elapsedMs(float $startTime): int
    {
        return (int) round((microtime(true) - $startTime) * 1000);
    }
}
