<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserHourlyRateChange;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Standard 3 — Strict 6-Month Hourly Rate Governance.
 *
 * Enforces an immutable, append-only audit trail of rate changes.
 * No bypass; the most recent change must be ≥ 180 days old before another is allowed.
 */
class HourlyRateService
{
    public const LOCK_DAYS = 180;

    public function update(User $user, int $newRateMinor): UserHourlyRateChange
    {
        if ($newRateMinor < 1) {
            throw ValidationException::withMessages([
                'hourly_rate' => 'Hourly rate must be a positive integer in minor units.',
            ]);
        }

        return DB::transaction(function () use ($user, $newRateMinor) {
            $lockedUser = User::whereKey($user->id)->lockForUpdate()->firstOrFail();

            $latestChange = UserHourlyRateChange::where('user_id', $lockedUser->id)
                ->orderByDesc('changed_at')
                ->first();

            $now = CarbonImmutable::now('UTC');

            if ($latestChange) {
                $nextAllowed = CarbonImmutable::parse($latestChange->next_allowed_at)->utc();
                if ($now->lt($nextAllowed)) {
                    throw ValidationException::withMessages([
                        'hourly_rate' => 'You can change your hourly rate again on ' . $nextAllowed->toIso8601String() . '.',
                    ])->status(422);
                }
            }

            $oldRate = (int) $lockedUser->hourly_rate;
            $nextAllowed = $now->addDays(self::LOCK_DAYS);

            $change = UserHourlyRateChange::create([
                'user_id' => $lockedUser->id,
                'old_hourly_rate' => $oldRate,
                'new_hourly_rate' => $newRateMinor,
                'changed_at' => $now,
                'next_allowed_at' => $nextAllowed,
            ]);

            $lockedUser->forceFill([
                'hourly_rate' => $newRateMinor,
                'rate_updated_at' => $now,
                'hourly_rate_locked_until' => $nextAllowed,
            ])->save();

            return $change;
        });
    }

    public function history(User $user, int $limit = 25): \Illuminate\Support\Collection
    {
        return UserHourlyRateChange::where('user_id', $user->id)
            ->orderByDesc('changed_at')
            ->limit($limit)
            ->get();
    }
}
