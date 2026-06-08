<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckBetaAccess
{
    /**
     * Handle an incoming request.
     *
     * Only enforced when APP_ENV=staging. Bypassed entirely in all other
     * environments (local, production, testing) and when no access code
     * has been configured.
     */
    public function handle(Request $request, Closure $next)
    {
        // Only enforce in the staging environment
        if (config('app.env') !== 'staging') {
            return $next($request);
        }

        // If no staging access code is configured, allow all traffic through
        $stagingCode = config('app.staging_access_code', '');
        if (!$stagingCode) {
            return $next($request);
        }

        // Define whitelisted paths for automation, health checks, and the
        // beta-access gate itself (to prevent redirect loops)
        $whitelistedPaths = [
            '/api/*',
            '/health',
            '/health/*',
            '/status',
            '/webhooks/*',
            '/beta-access',
            '/beta-access/*',
            '/sitemap.xml',
            '/robots.txt',
            '/favicon.ico',
        ];

        foreach ($whitelistedPaths as $pattern) {
            if ($request->is(ltrim($pattern, '/'))) {
                return $next($request);
            }
        }

        // Validate the beta-access cookie
        $cookieName = 'kenfinly_beta_unlocked';
        $expectedValue = hash('sha256', $stagingCode);

        $hasValidCookie = $request->hasCookie($cookieName)
            && $request->cookie($cookieName) === $expectedValue;

        if (!$hasValidCookie) {
            // Store the intended URL so the controller can redirect back after
            // successful verification
            $request->session()->put('url.intended', $request->fullUrl());

            return redirect()->route('beta-access');
        }

        return $next($request);
    }
}
