<?php

namespace App\Http\Requests;

class RetryPaymentRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return ['payment_method' => ['nullable', 'string', 'max:100']];
    }
}