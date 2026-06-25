<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\ChangePinRequest;
use App\Http\Requests\UpdateSecuritySettingsRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Security settings management for the authenticated user.
 *
 * Endpoints:
 *  GET  /api/v1/user/security-settings  — fetch current toggle states
 *  PUT  /api/v1/user/security-settings  — partially update toggle states
 *  PUT  /api/v1/user/change-password    — change password, invalidate JWT
 *  POST /api/v1/user/change-pin         — set or change 6-digit PIN
 *
 * @tags Security
 */
class SecuritySettingsController extends Controller
{
    // ── Toggle settings ───────────────────────────────────────────────────────

    /**
     * GET /api/v1/user/security-settings
     *
     * Returns the current state of all four security toggles plus
     * `has_pin` (boolean) so the frontend knows whether to request
     * the current PIN when the user changes it.
     */
    public function show(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'success'  => true,
            'settings' => $this->formatSettings($user),
        ]);
    }

    /**
     * PUT /api/v1/user/security-settings
     *
     * Accepts a partial payload — only the submitted toggle fields are written.
     * Optimistic-update friendly: frontend sends one key at a time.
     */
    public function update(UpdateSecuritySettingsRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        $allowed = [
            'is_2fa_enabled',
            'is_biometric_enabled',
            'login_notifications_enabled',
            'security_alerts_enabled',
        ];

        $data = [];
        foreach ($allowed as $field) {
            if ($request->has($field)) {
                $data[$field] = (bool) $request->input($field);
            }
        }

        if (! empty($data)) {
            $user->update($data);
        }

        return response()->json([
            'success'  => true,
            'message'  => 'Security settings updated.',
            'settings' => $this->formatSettings($user->fresh()),
        ]);
    }

    // ── Change password ───────────────────────────────────────────────────────

    /**
     * PUT /api/v1/user/change-password
     *
     * Flow (per OWASP ASVS V2.1):
     *  1. Validate current password with Hash::check.
     *  2. Hash new password (bcrypt via Laravel default).
     *  3. Persist new hash.
     *  4. Invalidate the current JWT token so the session is immediately revoked.
     *
     * The client must re-authenticate after a successful password change.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'errors'  => ['current_password' => ['Current password is incorrect.']],
            ], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        // Invalidate the current JWT token — forces re-authentication.
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Throwable) {
            // Token may already be invalid; continue — password is already changed.
        }

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully. Please log in again.',
        ]);
    }

    // ── Change PIN ────────────────────────────────────────────────────────────

    /**
     * POST /api/v1/user/change-pin
     *
     * Flow (per OWASP ASVS V2.4):
     *  1. If a PIN already exists, validate current_pin.
     *  2. Verify the new PIN complies with the digit policy.
     *  3. Hash the new PIN with bcrypt (never plain-text).
     *  4. Persist the hash.
     *
     * PINs are never logged, never returned in responses.
     */
    public function changePin(ChangePinRequest $request): JsonResponse
    {
        $user   = auth('api')->user();
        $hasPin = ! is_null($user->pin_hash);

        if ($hasPin) {
            if (! $request->has('current_pin')) {
                return response()->json([
                    'success' => false,
                    'errors'  => ['current_pin' => ['Your current PIN is required to set a new one.']],
                ], 422);
            }

            if (! Hash::check($request->current_pin, $user->pin_hash)) {
                return response()->json([
                    'success' => false,
                    'errors'  => ['current_pin' => ['Current PIN is incorrect.']],
                ], 422);
            }
        }

        $user->update(['pin_hash' => Hash::make($request->new_pin)]);

        return response()->json([
            'success' => true,
            'message' => $hasPin ? 'PIN changed successfully.' : 'PIN set successfully.',
            'has_pin' => true,
        ]);
    }

    // ── Formatter ─────────────────────────────────────────────────────────────

    /**
     * @param  \App\Models\User  $user
     * @return array<string, mixed>
     */
    private function formatSettings($user): array
    {
        return [
            'is_2fa_enabled'              => (bool) $user->is_2fa_enabled,
            'is_biometric_enabled'        => (bool) $user->is_biometric_enabled,
            'login_notifications_enabled' => (bool) $user->login_notifications_enabled,
            'security_alerts_enabled'     => (bool) $user->security_alerts_enabled,
            'has_pin'                     => ! is_null($user->pin_hash),
        ];
    }
}
