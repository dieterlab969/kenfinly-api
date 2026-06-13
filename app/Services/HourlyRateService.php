<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserRateLog;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HourlyRateService
{
    private const REVIEW_WINDOW_H1 = 'H1';

    private const REVIEW_WINDOW_H2 = 'H2';

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

    public function history(User $user, int $limit = 25): \Illuminate\Support\Collection
    {
        return UserRateLog::where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    private function currentReviewDate(User $user): CarbonImmutable
    {
        $timezone = $user->timezone ?: config('app.timezone', 'UTC');

        return CarbonImmutable::now($timezone);
    }

    private function resolveReviewWindow(CarbonImmutable $currentDate): string
    {
        return $currentDate->month <= 6
            ? self::REVIEW_WINDOW_H1
            : self::REVIEW_WINDOW_H2;
    }
}
