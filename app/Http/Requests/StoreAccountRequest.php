<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Validates the payload for creating a new wallet / account.
 *
 * BALANCE POLICY
 * ──────────────
 * `balance` here represents the *opening balance* — the only time a numeric
 * balance is accepted as direct user input. After creation, balance is
 * read-only from the API's perspective: it changes exclusively through
 * financial transactions (POST /api/transactions).
 *
 * RULES RATIONALE
 * ───────────────
 * - `name`         required, max:255 — display label, must exist
 * - `balance`      required, numeric — opening balance; negative allowed for
 *                  credit-card / debt accounts
 * - `currency`     nullable, size:3  — ISO 4217 (USD, VND, EUR …); defaults to
 *                  locale-based value in the controller when omitted
 * - `icon`         nullable, max:50  — single emoji or short identifier
 * - `color`        nullable, max:7, hex format — e.g. #3b82f6
 * - `account_type` nullable, enum   — one of the five supported types
 */
class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authentication is already enforced by the auth:api middleware.
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:255'],
            'balance'      => ['required', 'numeric'],
            'currency'     => ['nullable', 'string', 'size:3'],
            'icon'         => ['nullable', 'string', 'max:50'],
            'color'        => ['nullable', 'string', 'max:7', 'regex:/^#[0-9a-fA-F]{3,6}$/'],
            'account_type' => ['nullable', 'string', 'in:wallet,bank,savings,credit_card,investment'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Account name is required.',
            'name.max'           => 'Account name may not exceed 255 characters.',
            'balance.required'   => 'Opening balance is required.',
            'balance.numeric'    => 'Opening balance must be a valid number.',
            'currency.size'      => 'Currency must be a 3-letter ISO 4217 code (e.g. VND, USD, EUR).',
            'color.regex'        => 'Color must be a valid hex value (e.g. #3b82f6 or #fff).',
            'account_type.in'    => 'Account type must be one of: wallet, bank, savings, credit_card, investment.',
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
