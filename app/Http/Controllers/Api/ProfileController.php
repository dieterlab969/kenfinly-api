<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AvatarUploadRequest;
use App\Services\AvatarUploadService;
use App\Services\ProfileUpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

/**
 * Authenticated user profile management.
 *
 * Endpoints:
 *  GET  /api/profile         – return the current user's full profile
 *  PUT  /api/profile         – partially update profile fields
 *  POST /api/profile/avatar  – upload and replace the profile avatar
 *
 * @tags Profile
 */
class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileUpdateService $profileUpdateService,
        private readonly AvatarUploadService  $avatarUploadService,
    ) {}

    // ── GET /api/profile ─────────────────────────────────────────────────────

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

    // ── POST /api/profile/avatar ──────────────────────────────────────────────

    /**
     * Upload, resize, compress, and store a new avatar for the authenticated user.
     *
     * Accepts multipart/form-data with an `avatar` field.
     * Constraints: JPEG / PNG / WebP, max 2 MB.
     * The old avatar is automatically deleted before the new one is stored.
     */
    public function uploadAvatar(AvatarUploadRequest $request): JsonResponse
    {
        $user = auth('api')->user();

        try {
            $avatarUrl = $this->avatarUploadService->upload($user, $request->file('avatar'));
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Avatar upload failed. Please try again.',
            ], 500);
        }

        $user->refresh()->load('roles', 'language');

        return response()->json([
            'success'    => true,
            'message'    => 'Avatar uploaded successfully.',
            'avatar_url' => $avatarUrl,
            'profile'    => $this->formatProfile($user),
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
            'avatar'            => $this->resolveAvatarUrl($user->avatar),
            'email_verified'    => $user->isEmailVerified(),
            'email_verified_at' => $user->email_verified_at,
            'status'            => $user->status,
            'language'          => $user->language,
            'roles'             => $user->roles->pluck('name'),
            'created_at'        => $user->created_at,
            'updated_at'        => $user->updated_at,
        ];
    }

    /**
     * Resolve the avatar field to a fully qualified public URL.
     *
     * - null / empty  → null
     * - http(s) URL   → returned as-is  (OAuth avatars from Google / Facebook)
     * - relative path → prefixed with the public storage URL
     */
    private function resolveAvatarUrl(?string $avatar): ?string
    {
        if (blank($avatar)) {
            return null;
        }

        if (str_starts_with($avatar, 'http')) {
            return $avatar;
        }

        return Storage::disk('public')->url($avatar);
    }
}
