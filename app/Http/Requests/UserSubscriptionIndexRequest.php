<?php

namespace App\Http\Requests;

class UserSubscriptionIndexRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'in:ACTIVE,EXPIRED'],
            'billing_cycle' => ['nullable', 'in:WEEKLY,MONTHLY,YEARLY'],
            'search' => ['nullable', 'string', 'max:255'],
            'sort' => ['nullable', 'in:next_billing_date_asc,next_billing_date_desc,amount_high,amount_low,name_asc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}