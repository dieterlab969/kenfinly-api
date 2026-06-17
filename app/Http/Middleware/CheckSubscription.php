<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards API routes that require an active or in-trial subscription.
 *
 * Enforcement logic:
 *  - Super admins bypass all checks unconditionally.
 *  - Owner accounts must be either within a free trial period OR hold an
 *    active paid subscription. Expired trials and lapsed paid plans are
 *    blocked and their `subscription_status` is updated to "expired" lazily
 *    on the first request after the deadline.
 *  - Editor / Viewer accounts are not subject to this middleware because
 *    their access is governed by the workspace Owner's subscription.
 *
 * On failure, the middleware returns HTTP 402 with a structured JSON body
 * including a `redirect` hint pointing to `/pricing`.
 *
 * Applied via the `check.subscription` middleware alias in
 * `app/Http/Kernel.php` (or `bootstrap/app.php` in Laravel 12).
 */
class CheckSubscription
{
    /**
     * Handle an incoming request.
     *
     * Resolves the authenticated user, short-circuits for super admins, then
     * evaluates the `subscription_status` field:
     *  - "active"  → pass through unless `subscription_expires_at` is in the past.
     *  - "trial"   → pass through unless `trial_ends_at` is in the past.
     *  - anything else (expired, revoked, null) → 402 Payment Required.
     *
     * @param  Request  $request  The incoming HTTP request.
     * @param  Closure  $next     The next middleware / controller handler.
     * @return Response           The downstream response or a 402 JSON response.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user->hasRole('super_admin')) {
            return $next($request);
        }

        $status = $user->subscription_status ?? 'trial';

        if ($status === 'active') {
            $expires = $user->subscription_expires_at;
            if ($expires && $expires->isPast()) {
                $user->update(['subscription_status' => 'expired']);
                return $this->paymentRequired();
            }
            return $next($request);
        }

        if ($status === 'trial') {
            $trialEnds = $user->trial_ends_at;
            if ($trialEnds && $trialEnds->isPast()) {
                $user->update(['subscription_status' => 'expired']);
                return $this->paymentRequired();
            }
            return $next($request);
        }

        return $this->paymentRequired();
    }

    /**
     * Build a 402 Payment Required JSON response.
     *
     * The `code` field ("SUBSCRIPTION_REQUIRED") is intended for the React
     * frontend to identify this specific error type and redirect the user to
     * the pricing page automatically.
     *
     * @return Response  HTTP 402 JSON response with message, code, and redirect hint.
     */
    private function paymentRequired(): Response
    {
        return response()->json([
            'message'  => 'Subscription required. Please upgrade your plan.',
            'code'     => 'SUBSCRIPTION_REQUIRED',
            'redirect' => '/pricing',
        ], 402);
    }
}
