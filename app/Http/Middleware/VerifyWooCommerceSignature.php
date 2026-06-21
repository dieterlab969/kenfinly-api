<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verifies that an incoming request originated from a trusted WooCommerce site.
 *
 * WooCommerce signs every webhook payload with HMAC-SHA256 using the shared
 * secret configured on the webhook delivery settings page. The resulting
 * binary digest is Base64-encoded and sent in the X-WC-Webhook-Signature header.
 *
 * Verification steps:
 *  1. Read the raw request body BEFORE any framework parsing (getContent()).
 *  2. Recompute HMAC-SHA256(body, WOOCOMMERCE_WEBHOOK_SECRET) in binary form.
 *  3. Base64-encode the local digest.
 *  4. Compare with the header value using hash_equals() — constant-time
 *     comparison prevents timing-based signature oracle attacks.
 *
 * Any request that is missing the header or fails the comparison is rejected
 * with 401 Unauthorized. The endpoint never reveals why verification failed.
 */
class VerifyWooCommerceSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('X-WC-Webhook-Signature');

        if (empty($signature)) {
            Log::warning('WooCommerce webhook: missing X-WC-Webhook-Signature header', [
                'ip'   => $request->ip(),
                'path' => $request->path(),
            ]);

            return response()->json(['error' => 'Missing webhook signature.'], 401);
        }

        $secret = config('services.woocommerce.webhook_secret');

        if (empty($secret)) {
            Log::error('WooCommerce webhook: WOOCOMMERCE_WEBHOOK_SECRET is not set in the environment.');

            return response()->json(['error' => 'Webhook secret not configured.'], 500);
        }

        // Read raw body — must be done before any Laravel body parsing
        $rawBody  = $request->getContent();
        $expected = base64_encode(hash_hmac('sha256', $rawBody, $secret, true));

        if (!hash_equals($expected, $signature)) {
            Log::warning('WooCommerce webhook: signature mismatch — possible spoofed request', [
                'ip'   => $request->ip(),
                'path' => $request->path(),
            ]);

            return response()->json(['error' => 'Invalid webhook signature.'], 401);
        }

        return $next($request);
    }
}
