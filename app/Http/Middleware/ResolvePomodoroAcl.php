<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Exceptions\JWTException;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Resolve Pomodoro access capabilities for guests and authenticated users.
 *
 * The middleware applies the lightweight ACL described by the Pomodoro sync
 * specification. Guests may use the timer only with local client storage,
 * while authenticated and non-suspended users receive database-backed syncing
 * abilities that are attached to the request attributes.
 */
class ResolvePomodoroAcl
{
    /**
     * Resolve the Pomodoro ACL payload for the current request.
     *
     * If a bearer token is present, the middleware attempts JWT authentication
     * even though the route itself is public. Successful authentication upgrades
     * the actor from guest capabilities to registered-user capabilities.
     *
     * @param Request $request Incoming HTTP request.
     * @param Closure(Request): Response $next Next middleware in the pipeline.
     *
     * @return Response HTTP response for the current request.
     */
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
