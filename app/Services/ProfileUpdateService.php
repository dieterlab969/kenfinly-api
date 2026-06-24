<?php

namespace App\Services;

use App\Models\User;

/**
 * Encapsulates all business logic for updating a user's profile.
 *
 * Responsibilities:
 *  - Apply a partial-update pattern (only keys present in $data are written).
 *  - Reset `email_verified_at` to null whenever the email address changes,
 *    forcing the user through re-verification on the next login prompt.
 *  - Return the refreshed User model after persisting changes.
 */
class ProfileUpdateService
{
    /**
     * The profile fields this service is allowed to write.
     *
     * Any key in $data that is NOT in this list is silently ignored,
     * preventing mass-assignment from unexpected callers.
     */
    private const ALLOWED_FIELDS = [
        'name',
        'email',
        'phone',
        'address',
        'date_of_birth',
        'gender',
    ];

    /**
     * Apply a validated, partial profile update to the given user.
     *
     * Only the keys that are present in $data (and whitelisted) are written.
     * The caller is responsible for validation before invoking this method.
     *
     * @param  User                     $user  The authenticated user to update.
     * @param  array<string, mixed>     $data  Validated, partial update payload.
     * @return User                            The user instance after saving.
     */
    public function update(User $user, array $data): User
    {
        $payload = $this->buildPayload($user, $data);

        if (! empty($payload)) {
            $user->update($payload);
            $user->refresh();
        }

        return $user;
    }

    /**
     * Build the final write payload from the incoming data.
     *
     * Handles the email-change side-effect: if the caller supplies a new
     * email address that differs from the current one, `email_verified_at`
     * is reset to null so the account requires re-verification.
     *
     * @param  User                  $user
     * @param  array<string, mixed>  $data  Already-validated input.
     * @return array<string, mixed>         Payload ready for Eloquent update().
     */
    private function buildPayload(User $user, array $data): array
    {
        $payload = [];

        foreach (self::ALLOWED_FIELDS as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        // When the email changes, revoke the current verification so the
        // account must be re-verified against the new address.
        if (
            isset($payload['email']) &&
            $payload['email'] !== $user->email
        ) {
            $payload['email_verified_at'] = null;
            $payload['status']            = 'pending';
        }

        return $payload;
    }
}
