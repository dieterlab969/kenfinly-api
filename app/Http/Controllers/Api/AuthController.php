<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\User;
use App\Rules\Recaptcha;
use App\Services\EmailVerificationService;
use App\Services\EmailValidationService;
use App\Services\BotDetectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\SubscriptionPlan;
use App\Models\Subscription;

/**
 * Controller handling user authentication and registration via API.
 *
 * Provides endpoints for user registration, login, token refresh, logout,
 * and retrieving authenticated user info and app configuration.
 */
class AuthController extends Controller
{
    /**
     * AuthController constructor.
     *
     * @param EmailVerificationService $emailVerificationService
     * @param EmailValidationService $emailValidationService
     */
    public function __construct(
        private EmailVerificationService $emailVerificationService,
        private EmailValidationService $emailValidationService
    ) {
    }

    /**
     * Register a new user.
     *
     * Validates input data, creates the user with a pending status,
     * assigns the "owner" role, and enrolls the user in the Free subscription plan automatically.
     * Sends an email verification link and returns registration status.
     *
     * @param \Illuminate\Http\Request $request Incoming registration request
     * @return \Illuminate\Http\JsonResponse JSON response with registration result and verification info
     */
    public function register(Request $request)
    {
        $rules = [
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];

        $messages = [
            'name.required' => 'Please enter your name',
            'name.max' => 'Name must not exceed 100 characters',
            'email.required' => 'Please enter your email address',
            'email.email' => 'Please enter a valid email address',
            'email.unique' => 'This email is already registered. Please login or use a different email.',
            'password.required' => 'Please enter a password',
            'password.min' => 'Password must be at least 8 characters long',
            'password.confirmed' => 'Password confirmation does not match. Please make sure both passwords are the same.',
        ];

        if (AppSetting::isRecaptchaEnabled()) {
            $rules['g-recaptcha-response'] = ['required', 'string', new Recaptcha];
            $messages['g-recaptcha-response.required'] = 'Security verification is required.';
        }

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please check the errors below.',
                'errors' => $validator->errors()
            ], 422);
        }

        $emailValidation = $this->emailValidationService->validate($request->email);
        if (!$emailValidation['valid']) {
            Log::info('Email validation failed during registration', [
                'email' => $request->email,
                'errors' => $emailValidation['errors'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Email validation failed.',
                'errors' => ['email' => $emailValidation['errors']],
            ], 422);
        }

        if (!empty($emailValidation['warnings'])) {
            Log::info('Email validation warnings during registration', [
                'email' => $request->email,
                'warnings' => $emailValidation['warnings'],
            ]);
        }

        $suggestion = $this->emailValidationService->getTypoSuggestion($request->email);
        if ($suggestion) {
            Log::info('Email typo suggestion available', [
                'original' => $request->email,
                'suggestion' => $suggestion,
            ]);
        }

        $botDetection = new BotDetectionService($request);
        $botAnalysis = $botDetection->analyzeRegistrationAttempt($request->name, $request->email);

        if ($botAnalysis['should_block']) {
            Log::warning('Bot registration attempt blocked', [
                'name' => $request->name,
                'email' => $request->email,
                'reasons' => $botAnalysis['reasons'],
                'risk_score' => $botAnalysis['risk_score'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration blocked due to suspicious activity. If you believe this is an error, please contact support.',
            ], 403);
        }

        if ($botAnalysis['is_suspicious']) {
            Log::info('Suspicious registration pattern detected but allowed', [
                'name' => $request->name,
                'email' => $request->email,
                'reasons' => $botAnalysis['reasons'],
                'risk_score' => $botAnalysis['risk_score'],
            ]);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'pending',
        ]);

        $user->assignRole('owner');

        // Automatically enroll in Free plan
        $freePlan = SubscriptionPlan::where('name', 'Free')->first();
        if ($freePlan) {
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $freePlan->id,
                'status' => 'active',
                'amount' => 0,
                'currency' => 'VND',
                'start_date' => now(),
            ]);
        }

        try {
            $verification = $this->emailVerificationService->sendVerificationEmail($user);

            return response()->json([
                'success' => true,
                'message' => 'Registration successful! Please check your email to verify your account.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->status,
                    'email_verified' => false,
                ],
                'verification_sent' => true,
                'verification_expires_at' => $verification->expires_at,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to send verification email during registration', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Registration successful, but we could not send a verification email. Please contact support.',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status' => $user->status,
                    'email_verified' => false,
                ],
                'verification_sent' => false,
            ], 201);
        }
    }

    /**
     * Authenticate user and issue a JWT token.
     *
     * Validates login credentials, checks email verification and suspension status,
     * and returns an access token if successful.
     * Sends verification email if email is unverified and throttles repeated sends.
     *
     * @param \Illuminate\Http\Request $request Incoming login request
     * @return \Illuminate\Http\JsonResponse JSON response with authentication result or verification prompt
     */
    public function login(Request $request)
    {
        $rules = [
            'email' => 'required|email',
            'password' => 'required|string',
        ];

        $messages = [
            'email.required' => 'Please enter your email address',
            'email.email' => 'Please enter a valid email address',
            'password.required' => 'Please enter your password',
        ];

        if (AppSetting::isRecaptchaEnabled()) {
            $rules['g-recaptcha-response'] = ['required', 'string', new Recaptcha];
            $messages['g-recaptcha-response.required'] = 'Security verification is required.';
        }

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed. Please check the errors below.',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password. Please check your credentials and try again.'
            ], 401);
        }

        $user = auth('api')->user();

        if (!$user->isEmailVerified()) {
            auth('api')->logout();

            $verificationSent = false;
            $verificationExpiresAt = null;

            try {
                $recentVerification = $user->emailVerifications()
                    ->whereNull('verified_at')
                    ->latest()
                    ->first();

                $shouldSendEmail = !$recentVerification ||
                    $recentVerification->created_at->diffInMinutes(now()) >= 5;

                if ($shouldSendEmail) {
                    $verification = $this->emailVerificationService->sendVerificationEmail($user);
                    $verificationSent = true;
                    $verificationExpiresAt = $verification->expires_at;

                    Log::info('Verification email sent during login', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                    ]);
                } else {
                    $verificationExpiresAt = $recentVerification->expires_at;

                    Log::info('Skipped sending verification email (too recent)', [
                        'user_id' => $user->id,
                        'minutes_since_last' => $recentVerification->created_at->diffInMinutes(now()),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Failed to send verification email during login', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return response()->json([
                'success' => false,
                'action' => 'verify_email',
                'message' => 'Please verify your email address before logging in. We\'ve sent you a verification link.',
                'email_verified' => false,
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'status' => $user->status,
                ],
                'verification_sent' => $verificationSent,
                'verification_expires_at' => $verificationExpiresAt,
            ], 403);
        }

        if ($user->isSuspended()) {
            auth('api')->logout();

            return response()->json([
                'success' => false,
                'message' => 'Your account has been suspended. Please contact support.',
                'status' => $user->status,
            ], 403);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Get the currently authenticated user.
     *
     * Loads the user's roles and returns user data.
     *
     * @return \Illuminate\Http\JsonResponse JSON response with authenticated user data
     */
    public function me()
    {
        $user = auth('api')->user();
        $user->load('roles');

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

    /**
     * Get application configuration details.
     *
     * Returns status of reCAPTCHA feature and the site key.
     *
     * @return \Illuminate\Http\JsonResponse JSON response with app configuration
     */
    public function config()
    {
        return response()->json([
            'success' => true,
            'config' => [
                'recaptcha_enabled' => AppSetting::isRecaptchaEnabled(),
                'recaptcha_site_key' => config('services.recaptcha.site_key'),
            ]
        ]);
    }

    /**
     * Log out the authenticated user by invalidating the token.
     *
     * @return \Illuminate\Http\JsonResponse JSON response confirming logout
     */
    public function logout()
    {
        auth('api')->logout();

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out'
        ]);
    }

    /**
     * Refresh the JWT token.
     *
     * Issues a new token and returns it with user info.
     *
     * @return \Illuminate\Http\JsonResponse JSON response with refreshed token
     */
    public function refresh()
    {
        return $this->respondWithToken(auth('api')->refresh());
    }

    /**
     * Format and return the token response structure.
     *
     * Includes the token, token type, expiration, and authenticated user data.
     *
     * @param string $token JWT access token
     * @return \Illuminate\Http\JsonResponse JSON response with token and user info
     */
    protected function respondWithToken($token)
    {
        $user = auth('api')->user();
        $user->load('roles');

        return response()->json([
            'success' => true,
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $user
        ]);
    }
}
