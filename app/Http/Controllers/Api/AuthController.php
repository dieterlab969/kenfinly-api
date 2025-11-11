<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\User;
use App\Rules\Recaptcha;
use App\Services\EmailVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function __construct(
        private EmailVerificationService $emailVerificationService
    ) {}

    /**
     * Register a new user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
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

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'status' => 'pending',
        ]);

        $user->assignRole('owner');

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
     * Get a JWT via given credentials.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
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
            
            return response()->json([
                'success' => false,
                'message' => 'Please verify your email address before logging in. Check your inbox for the verification link.',
                'email_verified' => false,
                'status' => $user->status,
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
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
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
     * Get app configuration including reCAPTCHA status.
     *
     * @return \Illuminate\Http\JsonResponse
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
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
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
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        return $this->respondWithToken(auth('api')->refresh());
    }

    /**
     * Get the token array structure.
     *
     * @param  string $token
     *
     * @return \Illuminate\Http\JsonResponse
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
