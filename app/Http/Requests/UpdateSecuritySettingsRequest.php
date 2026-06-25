<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates PUT /api/v1/user/security-settings.
 *
 * All four toggle fields are optional so the frontend may send
 * a partial update (e.g. only the changed toggle).
 */
class UpdateSecuritySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'is_2fa_enabled'              => ['sometimes', 'boolean'],
            'is_biometric_enabled'        => ['sometimes', 'boolean'],
            'login_notifications_enabled' => ['sometimes', 'boolean'],
            'security_alerts_enabled'     => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'is_2fa_enabled.boolean'              => 'Two-Factor Authentication must be true or false.',
            'is_biometric_enabled.boolean'        => 'Biometric Login must be true or false.',
            'login_notifications_enabled.boolean' => 'Login Notifications must be true or false.',
            'security_alerts_enabled.boolean'     => 'Security Alerts must be true or false.',
        ];
    }

    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
