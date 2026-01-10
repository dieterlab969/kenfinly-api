<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if (!$user->isEmailVerified()) {
            return response()->json([
                'success' => false,
                'message' => 'Your email address is not verified. Please check your email for a verification link.',
                'email_verified' => false,
                'status' => $user->status,
            ], 403);
        }

        if ($user->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Your account is pending verification.',
                'status' => $user->status,
            ], 403);
        }

        if ($user->isSuspended()) {
            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact support.',
                'status' => $user->status,
            ], 403);
        }

        return $next($request);
    }
}
