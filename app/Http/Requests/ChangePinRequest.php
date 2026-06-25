<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates POST /api/v1/user/change-pin.
 *
 * PIN rules (per OWASP):
 *  - Exactly 6 digits (0-9).
 *  - Must be confirmed.
 *  - current_pin required only when the user already has a PIN set.
 *
 * PIN correctness (Hash::check) and the conditional current_pin
 * requirement are handled in the controller after this request passes.
 */
class ChangePinRequest extends FormRequest
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
            'current_pin' => ['sometimes', 'string', 'digits:6'],
            'new_pin'     => ['required', 'string', 'digits:6', 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_pin.digits'  => 'Current PIN must be exactly 6 digits.',
            'new_pin.required'    => 'Please enter a new PIN.',
            'new_pin.digits'      => 'New PIN must be exactly 6 digits.',
            'new_pin.confirmed'   => 'New PIN confirmation does not match.',
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
