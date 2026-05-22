<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $maxAttempts = '60', string $decayMinutes = '1'): Response
    {
        $key = $this->resolveRequestSignature($request);
        $maxAttempts = (int) $maxAttempts;
        $decayMinutes = (int) $decayMinutes;

        // Get current attempt count
        $attempts = Cache::get($key, 0);

        if ($attempts >= $maxAttempts) {
            // Log rate limit exceeded
            Log::warning('API rate limit exceeded', [
                'ip' => $request->ip(),
                'endpoint' => $request->path(),
                'user_agent' => $request->userAgent(),
                'attempts' => $attempts,
                'max_attempts' => $maxAttempts,
            ]);

            return response()->json([
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $this->getRetryAfter($key, $decayMinutes),
            ], 429);
        }

        // Increment attempt counter
        Cache::put($key, $attempts + 1, now()->addMinutes($decayMinutes));

        $response = $next($request);

        // Add rate limit headers
        $response->headers->set('X-RateLimit-Limit', $maxAttempts);
        $response->headers->set('X-RateLimit-Remaining', max(0, $maxAttempts - $attempts - 1));
        $response->headers->set('X-RateLimit-Reset', now()->addMinutes($decayMinutes)->timestamp);

        return $response;
    }

    /**
     * Resolve request signature for rate limiting
     */
    protected function resolveRequestSignature(Request $request): string
    {
        // Combine IP address and route for unique key
        return 'rate_limit:' . sha1(
            $request->ip() . '|' . $request->path()
        );
    }

    /**
     * Get the number of seconds until rate limit resets
     */
    protected function getRetryAfter(string $key, int $decayMinutes): int
    {
        $expiresAt = Cache::get($key . ':expires_at');
        
        if (!$expiresAt) {
            return $decayMinutes * 60;
        }

        return max(0, $expiresAt - now()->timestamp);
    }
}
