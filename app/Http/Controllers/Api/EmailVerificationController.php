<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

class EmailVerificationController extends Controller
{
    public function __construct(
        private EmailVerificationService $emailVerificationService
    ) {}

    public function verify(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string|size:64',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid token format.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $token = $request->input('token');
        $rateLimitKey = 'email-verification:' . $token;

        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            return response()->json([
                'success' => false,
                'message' => 'Too many verification attempts. Please try again in ' . ceil($seconds / 60) . ' minutes.',
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 300);

        $result = $this->emailVerificationService->verifyEmail($token);

        if (!$result['success']) {
            return response()->json($result, 400);
        }

        RateLimiter::clear($rateLimitKey);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
        ], 200);
    }

    public function resend(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email address.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->input('email');
        $rateLimitKey = 'resend-verification:' . $email;

        if (RateLimiter::tooManyAttempts($rateLimitKey, 3)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            
            return response()->json([
                'success' => false,
                'message' => 'Too many resend attempts. Please try again in ' . ceil($seconds / 60) . ' minutes.',
            ], 429);
        }

        RateLimiter::hit($rateLimitKey, 600);

        $user = \App\Models\User::where('email', $email)->first();

        if ($user && !$user->isEmailVerified()) {
            try {
                $this->emailVerificationService->resendVerificationEmail($user);
            } catch (\Exception $e) {
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'If an account with this email exists and is not verified, a verification link has been sent.',
        ], 200);
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated.',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'email_verified' => $user->isEmailVerified(),
                'status' => $user->status,
                'email' => $user->email,
            ],
        ], 200);
    }
}
