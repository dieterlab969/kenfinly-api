<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHaloTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'type' => ['required', 'in:income,expense'],
            'ledger_type' => ['nullable', 'in:real,halo'],
            'amount_minor' => ['required', 'integer', 'not_in:0'],
            'transaction_date' => ['required', 'date'],
            'currency' => ['nullable', 'string', 'size:3'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'idempotency_key' => ['nullable', 'string', 'min:8', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount_minor.integer' => 'amount_minor must be an integer (no floats).',
            'amount_minor.not_in' => 'amount_minor cannot be zero.',
        ];
    }
}
