<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates the payload for updating wallet / account metadata.
 *
 * BALANCE POLICY
 * ──────────────
 * `balance` is intentionally and permanently absent from these rules.
 * After a wallet is created, its balance is derived exclusively from the
 * transaction ledger. To correct a balance, use the "Adjust Balance" flow
 * which creates an income or expense transaction for the difference.
 *
 * Editable metadata fields: name, currency, icon, color, account_type.
 * All fields are optional (sometimes) to allow partial PATCH-style updates
 * via PUT — only the keys present in the request body are validated and applied.
 */
class UpdateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authentication is already enforced by the auth:api middleware.
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => ['sometimes', 'required', 'string', 'max:255'],
            'currency'     => ['sometimes', 'nullable', 'string', 'size:3'],
            'icon'         => ['sometimes', 'nullable', 'string', 'max:50'],
            'color'        => ['sometimes', 'nullable', 'string', 'max:7', 'regex:/^#[0-9a-fA-F]{3,6}$/'],
            'account_type' => ['sometimes', 'nullable', 'string', 'in:wallet,bank,savings,credit_card,investment'],
            // `balance` is explicitly excluded — any `balance` key in the
            // request body is silently ignored by the controller.
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'Account name is required.',
            'name.max'        => 'Account name may not exceed 255 characters.',
            'currency.size'   => 'Currency must be a 3-letter ISO 4217 code (e.g. VND, USD, EUR).',
            'color.regex'     => 'Color must be a valid hex value (e.g. #3b82f6 or #fff).',
            'account_type.in' => 'Account type must be one of: wallet, bank, savings, credit_card, investment.',
        ];
    }

    /**
     * Override the default failed-validation response to keep our API
     * envelope format consistent: { success, message, errors }.
     */
    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
