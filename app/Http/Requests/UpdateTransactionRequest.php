<?php

namespace App\Http\Requests;

class UpdateTransactionRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            'account_id' => ['sometimes', 'required', 'integer', 'exists:accounts,id'],
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'type' => ['sometimes', 'required', 'in:income,expense'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'transaction_date' => ['sometimes', 'required', 'date'],
            'receipt' => ['nullable', 'image', 'max:20480'],
        ];
    }
}