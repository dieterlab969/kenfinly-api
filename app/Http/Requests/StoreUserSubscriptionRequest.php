<?php

namespace App\Http\Requests;

class StoreUserSubscriptionRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            'service_name' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['required', 'string', 'in:VND,USD'],
            'billing_cycle' => ['required', 'in:WEEKLY,MONTHLY,YEARLY'],
            'next_billing_date' => ['required', 'date'],
            'is_trial' => ['sometimes', 'boolean'],
            'reminder' => ['nullable', 'array'],
            'reminder.is_enabled' => ['boolean'],
            'reminder.remind_before_days' => ['integer', 'in:1,3,5,7,14'],
            'reminder.channels' => ['array'],
            'reminder.channels.*' => ['in:email,push'],
        ];
    }
}