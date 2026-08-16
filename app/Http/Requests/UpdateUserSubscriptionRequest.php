<?php

namespace App\Http\Requests;

class UpdateUserSubscriptionRequest extends StoreUserSubscriptionRequest
{
    public function rules(): array
    {
        return array_map(
            static fn (array $rules) => array_values(array_filter(
                $rules,
                static fn ($rule) => $rule !== 'required'
            )),
            parent::rules()
        );
    }
}