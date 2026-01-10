<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Recaptcha implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            $fail('The reCAPTCHA verification is required.');
            return;
        }

        try {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => config('services.recaptcha.secret_key'),
                'response' => $value,
            ]);

            $json = $response->json();

            if (!isset($json['success']) || !$json['success']) {
                Log::warning('reCAPTCHA verification failed', [
                    'error_codes' => $json['error-codes'] ?? [],
                ]);
                $fail('Invalid reCAPTCHA verification.');
                return;
            }

            if (!isset($json['score']) || $json['score'] < 0.5) {
                Log::warning('reCAPTCHA score too low', [
                    'score' => $json['score'] ?? 0,
                ]);
                $fail('Suspicious activity detected. Please try again.');
                return;
            }
        } catch (\Exception $e) {
            Log::error('reCAPTCHA verification exception', [
                'message' => $e->getMessage(),
            ]);
            $fail('reCAPTCHA verification failed. Please try again.');
        }
    }
}
