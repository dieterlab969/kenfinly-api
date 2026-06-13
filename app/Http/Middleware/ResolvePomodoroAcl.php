<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

class ResolvePomodoroAcl
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('api')->user();

        if (!$user && $request->bearerToken()) {
            try {
                $user = JWTAuth::parseToken()->authenticate();
                auth('api')->setUser($user);
                $request->setUserResolver(static fn () => $user);
            } catch (JWTException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        }

        if (!$user) {
            $request->attributes->set('pomodoro_acl', [
                'role' => 'guest',
                'database_logging' => false,
                'state_restoration' => false,
                'history_review' => false,
            ]);

            return $next($request);
        }

        if ($user->isSuspended()) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact support.',
                'status' => $user->status,
            ], 403);
        }

        $request->attributes->set('pomodoro_acl', [
            'role' => 'registered',
            'database_logging' => true,
            'state_restoration' => true,
            'history_review' => true,
        ]);

        return $next($request);
    }
}
