<?php

namespace App\Http\Requests;

class KillCommitmentRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return ['kill_reason' => ['nullable', 'string', 'max:255']];
    }
}