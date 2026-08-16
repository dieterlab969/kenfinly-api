<?php

namespace App\Http\Requests;

class CsvExportRequest extends ApiFormRequest
{
    public function authorize(): bool { return auth('api')->check(); }

    public function rules(): array
    {
        return [
            'account_id' => ['nullable', 'integer', 'exists:accounts,id'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'type' => ['nullable', 'in:income,expense'],
        ];
    }
}