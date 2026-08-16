<?php

namespace App\Http\Requests;

class StoreTransactionRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            // Ownership and the established "no account" business response
            // are resolved by TransactionService/controller after validation.
            'account_id' => ['required', 'integer'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'transaction_date' => ['required', 'date'],
            'receipt' => ['nullable', 'image', 'max:20480'],
        ];
    }
}