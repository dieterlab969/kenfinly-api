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
        // beta-access gate itself (to prevent redirect loops).
        //
        // IMPORTANT: OAuth callback landing pages (/auth/google/success and
        // /auth/google/error) MUST be whitelisted. These are real browser
        // redirects issued by the Laravel GoogleAuthController after the
        // Google consent flow completes. The user has no beta cookie at that
        // moment (they were in the middle of authenticating), so without this
        // whitelist entry the middleware intercepts the redirect, discards the
        // JWT token in the query string, and sends the user to /beta-access
        // instead of the dashboard. See: docs/issues/GOOGLE_OAUTH_BETA_GATE_REDIRECT.md
        $whitelistedPaths = [
            '/api/*',
            '/health',
            '/health/*',
            '/status',
            '/webhooks/*',
            '/beta-access',
            '/beta-access/*',
            '/auth/google/success',
            '/auth/google/error',
            '/auth/facebook/success',
            '/auth/facebook/error',
            '/chinh-sach-bao-mat',
            '/privacy-policy',
            '/dieu-khoan-dich-vu',
            '/terms-of-service',
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
