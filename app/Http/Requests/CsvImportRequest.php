<?php

namespace App\Http\Requests;

class CsvImportRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
        ];
    }
}