<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Form Request for avatar upload validation.
 *
 * Validates strictly by:
 *  1. Requiring the field to be present.
 *  2. Ensuring it is an image (magic-byte check done by the image rule).
 *  3. Restricting MIME types to JPEG, PNG, and WebP via finfo (not just extension).
 *  4. Capping the file size at 2 MB.
 *
 * A second layer of magic-byte validation is applied inside AvatarUploadService
 * as a defence-in-depth measure.
 */
class AvatarUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'avatar' => [
                'required',
                'image',
                'mimes:jpeg,jpg,png,webp',
                'max:2048',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'avatar.required' => 'Please select an image file to upload.',
            'avatar.image'    => 'The uploaded file must be an image.',
            'avatar.mimes'    => 'Avatar must be a JPEG, PNG, or WebP image.',
            'avatar.max'      => 'Avatar file size must not exceed 2 MB.',
        ];
    }

    /**
     * Return a consistent JSON shape when validation fails.
     *
     * Ensures all 422 responses from this endpoint include `success: false`
     * and the standard `errors` object, matching the rest of the API.
     */
    protected function failedValidation(ValidatorContract $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
