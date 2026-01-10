<?php

namespace App\Services;

use App\Models\User;
use App\Models\EmailVerification;
use Illuminate\Support\Facades\Log;

class EmailVerificationService
{
    private const TOKEN_EXPIRATION_HOURS = 24;
    private const MAX_VERIFICATION_ATTEMPTS = 5;

    public function __construct(
        private SendGridService $sendGridService
    ) {}

    public function sendVerificationEmail(User $user): EmailVerification
    {
        $this->invalidatePreviousTokens($user);

        $verification = EmailVerification::createForUser($user, self::TOKEN_EXPIRATION_HOURS);

        $verificationUrl = $this->generateVerificationUrl($verification->token);

        try {
            $this->sendGridService->sendVerificationEmail(
                $user->email,
                $user->name,
                $verificationUrl,
                $verification->expires_at
            );

            Log::info('Verification email sent', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return $verification;
        } catch (\Exception $e) {
            Log::error('Failed to send verification email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function verifyEmail(string $token): array
    {
        $verification = EmailVerification::findValidToken($token);

        if (!$verification) {
            $this->logFailedAttempt($token);
            return [
                'success' => false,
                'message' => 'Invalid or expired verification token.',
            ];
        }

        if ($verification->attempts >= self::MAX_VERIFICATION_ATTEMPTS) {
            return [
                'success' => false,
                'message' => 'Maximum verification attempts exceeded. Please request a new verification email.',
            ];
        }

        $verification->incrementAttempts();

        $user = $verification->user;

        if ($user->isEmailVerified()) {
            return [
                'success' => false,
                'message' => 'Email is already verified.',
            ];
        }

        $verification->markAsVerified();
        $user->markEmailAsVerified();

        try {
            $this->sendGridService->sendConfirmationEmail(
                $user->email,
                $user->name
            );
        } catch (\Exception $e) {
            Log::error('Failed to send confirmation email', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        Log::info('Email verified successfully', [
            'user_id' => $user->id,
            'email' => $user->email,
        ]);

        return [
            'success' => true,
            'message' => 'Email verified successfully! You can now log in.',
            'user' => $user,
        ];
    }

    public function resendVerificationEmail(User $user): array
    {
        if ($user->isEmailVerified()) {
            return [
                'success' => false,
                'message' => 'Email is already verified.',
            ];
        }

        $recentVerification = $this->getRecentVerification($user);
        
        if ($recentVerification && $recentVerification->created_at->diffInMinutes(now()) < 5) {
            return [
                'success' => false,
                'message' => 'Please wait before requesting a new verification email.',
            ];
        }

        try {
            $verification = $this->sendVerificationEmail($user);

            return [
                'success' => true,
                'message' => 'Verification email sent successfully.',
                'expires_at' => $verification->expires_at,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to send verification email. Please try again later.',
            ];
        }
    }

    private function invalidatePreviousTokens(User $user): void
    {
        EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->delete();
    }

    private function generateVerificationUrl(string $token): string
    {
        $frontendUrl = env('FRONTEND_URL', env('APP_URL'));
        return $frontendUrl . '/verify-email?token=' . $token;
    }

    private function getRecentVerification(User $user): ?EmailVerification
    {
        return EmailVerification::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest()
            ->first();
    }

    private function logFailedAttempt(string $token): void
    {
        Log::warning('Failed verification attempt', [
            'token' => substr($token, 0, 10) . '...',
            'ip' => request()->ip(),
        ]);
    }
}
