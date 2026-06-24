<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Authenticated user profile management.
 *
 * @tags Profile
 */
class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile.
     *
     * Returns the full profile including roles and preferred language.
     */
    public function show()
    {
        $user = auth('api')->user();
        $user->load('roles', 'language');

        return response()->json([
            'success' => true,
            'profile' => $this->formatProfile($user),
        ]);
    }

    public function update(Request $request)
    {
        $user = auth('api')->user();

        $validator = Validator::make($request->all(), [
            'name'          => 'sometimes|required|string|min:2|max:100',
            'phone'         => 'sometimes|nullable|string|max:30|regex:/^[+\d\s\-().]{0,30}$/',
            'date_of_birth' => 'sometimes|nullable|date|before:today',
            'gender'        => 'sometimes|nullable|in:male,female,other,prefer_not_to_say',
        ], [
            'name.required'          => 'Name is required.',
            'name.min'               => 'Name must be at least 2 characters.',
            'name.max'               => 'Name must not exceed 100 characters.',
            'phone.max'              => 'Phone number must not exceed 30 characters.',
            'phone.regex'            => 'Phone number contains invalid characters.',
            'date_of_birth.date'     => 'Date of birth must be a valid date.',
            'date_of_birth.before'   => 'Date of birth must be in the past.',
            'gender.in'              => 'Gender must be one of: male, female, other, or prefer not to say.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors'  => $validator->errors(),
            ], 422);
        }

        $updateData = array_filter([
            'name'          => $request->has('name')          ? $request->name          : null,
            'phone'         => $request->has('phone')         ? $request->phone         : null,
            'date_of_birth' => $request->has('date_of_birth') ? $request->date_of_birth : null,
            'gender'        => $request->has('gender')        ? $request->gender        : null,
        ], fn ($v, $k) => $request->has($k), ARRAY_FILTER_USE_BOTH);

        if (! empty($updateData)) {
            $user->update($updateData);
        }

        $user->load('roles', 'language');

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'profile' => $this->formatProfile($user),
        ]);
    }

    private function formatProfile($user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'phone'             => $user->phone,
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
