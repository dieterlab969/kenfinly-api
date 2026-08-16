<?php

namespace App\Http\Requests;

use App\Models\AppSetting;
use App\Rules\Recaptcha;

class LoginRequest extends ApiFormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $rules = [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'app_currency' => ['nullable', 'string', 'in:VND,USD,vnd,usd'],
            'app_country' => ['nullable', 'string', 'size:2'],
        ];

        if (AppSetting::isRecaptchaEnabled()) {
            $rules['g-recaptcha-response'] = ['required', 'string', new Recaptcha];
        }

        return $rules;
    }
}