<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBetaAccess
{
    /**
     * Paths that should bypass the beta access check.
     * Includes API endpoints, webhooks, health checks, and the beta-access route itself.
     */
    protected $except = [
        '/beta-access',
        '/api/status',
        '/health',
        '/webhooks/*',
        '/api/webhooks/*',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/config',
        '/api/email/verify',
        '/api/email/resend',
        '/api/languages',
        '/api/languages/*',
        '/api/consent',
        '/api/settings/company',
        '/api/settings/logos',
        '/api/analytics/public-stats',
        '/api/subscription-plans',
        '/api/waitlist',
        '/api/wordpress/*',
        '/api/logo',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Check if path is in the exception list
        if ($this->shouldBypass($request)) {
            return $next($request);
        }

        // Check if user has valid beta access cookie
        if ($request->hasCookie('kenfinly_beta_unlocked')) {
            $cookieValue = $request->cookie('kenfinly_beta_unlocked');
            // Optional: validate cookie signature/hash for additional security
            return $next($request);
        }

        // Redirect to beta access gate
        return redirect('/beta-access');
    }

    /**
     * Determine if the request path should bypass beta access check.
     */
    protected function shouldBypass(Request $request): bool
    {
        foreach ($this->except as $except) {
            if ($except !== '/' && $request->is($except)) {
                return true;
            }
        }

        return false;
    }
}
