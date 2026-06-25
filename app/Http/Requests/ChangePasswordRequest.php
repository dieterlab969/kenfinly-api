<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates PUT /api/v1/user/change-password.
 *
 * Enforces:
 *  - current_password must be provided to prevent CSRF-style attacks.
 *  - new_password must be ≥ 8 characters and confirmed.
 *  - new_password must differ from current_password to discourage reuse.
 *
 * Current-password correctness (Hash::check) is validated in the
 * controller after this request passes, to keep logic concerns separated.
 */
class ChangePasswordRequest extends FormRequest
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
            'current_password' => ['required', 'string'],
            'new_password'     => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Please enter your current password.',
            'new_password.required'     => 'Please enter a new password.',
            'new_password.min'          => 'New password must be at least 8 characters.',
            'new_password.confirmed'    => 'New password confirmation does not match.',
            'new_password.different'    => 'New password must be different from your current password.',
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
