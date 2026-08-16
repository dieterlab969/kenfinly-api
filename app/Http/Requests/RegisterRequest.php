<?php

namespace App\Http\Requests;

use App\Models\AppSetting;
use App\Rules\Recaptcha;

class RegisterRequest extends ApiFormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'app_currency' => ['nullable', 'string', 'in:VND,USD,vnd,usd'],
            'app_country' => ['nullable', 'string', 'size:2'],
        ];

        if (AppSetting::isRecaptchaEnabled()) {
            $rules['g-recaptcha-response'] = ['required', 'string', new Recaptcha];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please enter your name',
            'email.required' => 'Please enter your email address',
            'email.email' => 'Please enter a valid email address',
            'email.unique' => 'This email is already registered. Please login or use a different email.',
            'password.required' => 'Please enter a password',
            'password.min' => 'Password must be at least 8 characters long',
            'password.confirmed' => 'Password confirmation does not match. Please make sure both passwords are the same.',
        ];
    }
}