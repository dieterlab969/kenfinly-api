<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckBetaAccess
{


    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip middleware in production or if not staging environment
        if (app()->environment('production') || !config('app.env') === 'staging') {
            return $next($request);
        }

        // Define whitelisted paths for automation and health checks
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

        // Check if current path is whitelisted
        foreach ($whitelistedPaths as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        // Check for beta access cookie
        $cookieName = 'kenfinly_beta_unlocked';
        $hasValidCookie = $request->hasCookie($cookieName) && 
                         $request->cookie($cookieName) === hash('sha256', config('app.staging_access_code', ''));

        if (!$hasValidCookie) {
            return redirect()->route('beta-access');
        }

        return $next($request);
    }
}