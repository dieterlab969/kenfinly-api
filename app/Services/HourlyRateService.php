<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserRateLog;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Enforce semi-annual hourly rate review governance.
 *
 * The service applies the UC004 rule that each user may update the native
 * hourly_rate field at most once per fixed review window (H1 or H2) in the
 * user's own timezone, while recording an append-only audit log.
 */
class HourlyRateService
{
    /**
     * Fixed review window for January through June.
     */
    private const REVIEW_WINDOW_H1 = 'H1';

    /**
     * Fixed review window for July through December.
     */
    private const REVIEW_WINDOW_H2 = 'H2';

    /**
     * Update the user's hourly rate within the current review window.
     *
     * The method locks the user row, determines the active semi-annual window in
     * the user's timezone, rejects duplicate changes within that window, writes a
     * rate log entry, and persists the updated native hourly_rate value.
     *
     * @param User $user User whose hourly rate is being updated.
     * @param int $newRateMinor New hourly rate in minor units.
     *
     * @return User Refreshed user model containing the persisted rate.
     *
     * @throws HttpResponseException When the current review window has already been used.
     * @throws ValidationException When the provided rate is not a positive integer.
     */
    public function update(User $user, int $newRateMinor): User
    {
        if ($newRateMinor < 1) {
            throw ValidationException::withMessages([
                'hourly_rate' => 'Hourly rate must be a positive integer in minor units.',
            ]);
        }

        return DB::transaction(function () use ($user, $newRateMinor) {
            $lockedUser = User::whereKey($user->id)->lockForUpdate()->firstOrFail();
            $currentDate = $this->currentReviewDate($lockedUser);
            $allowanceYear = (int) $currentDate->year;
            $reviewWindow = $this->resolveReviewWindow($currentDate);

            $existingWindowLog = UserRateLog::where('user_id', $lockedUser->id)
                ->where('allowance_year', $allowanceYear)
                ->where('review_window', $reviewWindow)
                ->exists();

            if ($existingWindowLog) {
                throw new HttpResponseException(response()->json([
                    'status' => 'error',
                    'code' => 'RATE_UPDATE_WINDOW_LOCKED',
                    'message' => 'Bạn đã cập nhật Mức định giá bản thân trong kỳ review này. Lần cập nhật tiếp theo sẽ được mở vào kỳ review tiếp theo.',
                ], 403));
            }

            $oldRate = (int) $lockedUser->hourly_rate;

            UserRateLog::create([
                'user_id' => $lockedUser->id,
                'old_rate' => $oldRate,
                'new_rate' => $newRateMinor,
                'allowance_year' => $allowanceYear,
                'review_window' => $reviewWindow,
            ]);

            $lockedUser->forceFill([
                'hourly_rate' => $newRateMinor,
                'rate_updated_at' => $currentDate,
                'hourly_rate_locked_until' => null,
            ])->save();

            return $lockedUser->fresh();
        });
    }

    /**
     * Return recent hourly rate change history for a user.
     *
     * @param User $user User whose governance log should be retrieved.
     * @param int $limit Maximum number of most recent log rows to return.
     *
     * @return \Illuminate\Support\Collection<int, UserRateLog> Ordered audit log entries.
     */
    public function history(User $user, int $limit = 25): \Illuminate\Support\Collection
    {
        return UserRateLog::where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    /**
     * Resolve the current date in the user's configured timezone.
     *
     * @param User $user User whose timezone determines governance windows.
     *
     * @return CarbonImmutable Current time in the user's effective timezone.
     */
    private function currentReviewDate(User $user): CarbonImmutable
    {
        $timezone = $user->timezone ?: config('app.timezone', 'UTC');

        return CarbonImmutable::now($timezone);
    }

    /**
     * Map a date to its fixed semi-annual review window.
     *
     * @param CarbonImmutable $currentDate Current user-local date.
     *
     * @return string One of the REVIEW_WINDOW_* constants.
     */
    private function resolveReviewWindow(CarbonImmutable $currentDate): string
    {
        return $currentDate->month <= 6
            ? self::REVIEW_WINDOW_H1
            : self::REVIEW_WINDOW_H2;
    }
}
