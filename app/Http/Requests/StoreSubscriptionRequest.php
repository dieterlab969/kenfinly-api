<?php

namespace App\Http\Requests;

class StoreSubscriptionRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return ['plan_id' => ['required', 'integer', 'exists:subscription_plans,id']];
    }
}