<?php

namespace App\Http\Requests;

class TransactionPhotoRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return ['photo' => ['required', 'image', 'max:20480']];
    }
}