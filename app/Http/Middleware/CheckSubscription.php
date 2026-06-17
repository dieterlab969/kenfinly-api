<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks access to protected routes for users whose subscription
 * is revoked, expired (trial over without active plan), or not active.
 *
 * Only enforces on Owner accounts — Editors/Viewers are covered by
 * workspace-level access granted by the account Owner.
 */
class CheckSubscription
{
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

    private function paymentRequired(): Response
    {
        return response()->json([
            'message'  => 'Subscription required. Please upgrade your plan.',
            'code'     => 'SUBSCRIPTION_REQUIRED',
            'redirect' => '/pricing',
        ], 402);
    }
}
