<?php

namespace App\Http\Middleware;

use App\Models\BlockedIp;
use App\Models\SuspiciousActivity;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class CheckBlockedIp
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ipAddress = $this->getClientIp($request);

        if (BlockedIp::isBlocked($ipAddress)) {
            SuspiciousActivity::log(
                $ipAddress,
                'Blocked IP attempted to access: ' . $request->path(),
                null,
                null,
                $request->userAgent(),
                [
                    'url' => $request->fullUrl(),
                    'method' => $request->method(),
                ],
                'high'
            );

            Log::warning('Blocked IP attempted access', [
                'ip' => $ipAddress,
                'url' => $request->fullUrl(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Access denied. Your IP address has been blocked due to suspicious activity.',
            ], 403);
        }

        return $next($request);
    }

    private function getClientIp(Request $request): string
    {
        if ($request->header('X-Forwarded-For')) {
            $ips = explode(',', $request->header('X-Forwarded-For'));
            return trim($ips[0]);
        }

        if ($request->header('X-Real-IP')) {
            return $request->header('X-Real-IP');
        }

        return $request->ip();
    }
}
