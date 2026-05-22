<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCommitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:1', 'max:160'],
            'goal_amount' => ['required', 'integer', 'min:1'],
            'deadline' => ['required', 'date', 'after:now'],
            'image' => [
                'nullable',
                'file',
                'image',
                'mimes:jpeg,jpg,png',
                'mimetypes:image/jpeg,image/png',
                'max:5120',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'goal_amount.integer' => 'goal_amount must be an integer (minor units).',
            'image.mimes' => 'Only JPEG and PNG images are accepted.',
            'image.max' => 'Image must not exceed 5MB.',
        ];
    }
}
