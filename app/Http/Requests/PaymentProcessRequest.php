<?php

namespace App\Http\Requests;

class PaymentProcessRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            'subscription_id' => ['required', 'integer', 'exists:subscriptions,id'],
            'payment_gateway_id' => ['required', 'integer', 'exists:payment_gateways,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['nullable', 'string', 'max:100'],
        ];
    }
}