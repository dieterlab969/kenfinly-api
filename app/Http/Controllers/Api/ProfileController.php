<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProfileUpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Authenticated user profile management.
 *
 * Endpoints:
 *  GET  /api/profile  – return the current user's profile
 *  PUT  /api/profile  – partially update the current user's profile
 *
 * @tags Profile
 */
class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileUpdateService $profileUpdateService
    ) {}

    // ── GET /api/profile ─────────────────────────────────────────────────────

    /**
     * Return the authenticated user's profile.
     */
    public function show(): JsonResponse
    {
        $user = auth('api')->user();
        $user->load('roles', 'language');

        return response()->json([
            'success' => true,
            'profile' => $this->formatProfile($user),
        ]);
    }

    // ── PUT /api/profile ─────────────────────────────────────────────────────

    /**
     * Partially update the authenticated user's profile.
     *
     * Only the fields present in the request body are written. All fields are
     * optional; at least one must be provided for a meaningful request.
     *
     * Email changes:
     *  - Validated for uniqueness (ignoring the current user's own row).
     *  - Trigger a reset of `email_verified_at` so the new address must be
     *    re-verified before the account is considered active again.
     */
    public function update(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'name'          => ['sometimes', 'required', 'string', 'min:2', 'max:100'],
            'email'         => ['sometimes', 'required', 'email', 'max:255',
                                Rule::unique('users', 'email')->ignore($user->id)],
            'phone'         => ['sometimes', 'nullable', 'string', 'max:30',
                                'regex:/^[+\d\s\-().]{0,30}$/'],
            'address'       => ['sometimes', 'nullable', 'string', 'max:500'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today'],
            'gender'        => ['sometimes', 'nullable',
                                Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
        ], [
            'name.required'          => 'Name is required.',
            'name.min'               => 'Name must be at least 2 characters.',
            'name.max'               => 'Name must not exceed 100 characters.',
            'email.required'         => 'Email address is required.',
            'email.email'            => 'Please provide a valid email address.',
            'email.unique'           => 'This email address is already in use.',
            'phone.max'              => 'Phone number must not exceed 30 characters.',
            'phone.regex'            => 'Phone number contains invalid characters.',
            'address.max'            => 'Address must not exceed 500 characters.',
            'date_of_birth.date'     => 'Date of birth must be a valid date.',
            'date_of_birth.before'   => 'Date of birth must be in the past.',
            'gender.in'              => 'Gender must be one of: male, female, other, or prefer_not_to_say.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Build the partial payload: only keys the caller actually sent.
        $fields = ['name', 'email', 'phone', 'address', 'date_of_birth', 'gender'];
        $data   = [];
        foreach ($fields as $field) {
            if ($request->has($field)) {
                $data[$field] = $request->input($field);
            }
        }

        $user = $this->profileUpdateService->update($user, $data);
        $user->load('roles', 'language');

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'profile' => $this->formatProfile($user),
        ]);
    }

    // ── Shared formatter ──────────────────────────────────────────────────────

    private function formatProfile($user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
            'address'           => $user->address,
            'date_of_birth'     => $user->date_of_birth
                                    ? $user->date_of_birth->format('Y-m-d')
                                    : null,
            'gender'            => $user->gender,
            'avatar'            => $user->avatar,
            'email_verified'    => $user->isEmailVerified(),
            'email_verified_at' => $user->email_verified_at,
            'status'            => $user->status,
            'language'          => $user->language,
            'roles'             => $user->roles->pluck('name'),
            'created_at'        => $user->created_at,
            'updated_at'        => $user->updated_at,
        ];
    }
}
