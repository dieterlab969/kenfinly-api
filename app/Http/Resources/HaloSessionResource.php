<?php

namespace App\Http\Resources;

use App\Services\AttendanceService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Standard 9 — Persistent Halo Countdown State.
 *
 * Always derives remaining seconds from `expected_end_at` in the database.
 * Frontend timers are visual only.
 *
 * New fields (check-in time enforcement):
 *   max_progress  int     100 for on_time, 50 for late (half-day absence)
 *   check_in_type string  'on_time' | 'late' | null
 *   window        array   Real-time check-in window status for this user
 */
class HaloSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attendance  = $this->resource['attendance'] ?? null;
        $user        = $this->resource['user'];

        $checkInType = $attendance?->check_in_type;
        $maxProgress = $checkInType === 'late' ? 50 : 100;
        $window      = $this->resolveWindow($user);

        if (!$attendance) {
            return [
                'state'             => 'idle',
                'attendance'        => null,
                'seconds_left'      => 0,
                'can_complete'      => false,
                'max_progress'      => 100,
                'check_in_type'     => null,
                'window'            => $window,
                'server_time'       => CarbonImmutable::now('UTC')->toIso8601String(),
                'current_streak'    => (int) ($user->current_streak ?? 0),
                'longest_streak'    => (int) ($user->longest_streak ?? 0),
                'hourly_rate_minor' => (int) ($user->hourly_rate ?? 0),
            ];
        }

        $expectedEndAt = CarbonImmutable::parse($attendance->expected_end_at)->utc();
        $now           = CarbonImmutable::now('UTC');
        $secondsLeft   = max(0, $now->diffInSeconds($expectedEndAt, false));

        $state = match ($attendance->status) {
            'completed' => 'completed',
            'killed'    => 'killed',
            default     => $secondsLeft > 0 ? 'in_progress' : 'ready',
        };

        return [
            'state'             => $state,
            'attendance'        => (new AttendanceResource($attendance))->toArray($request),
            'seconds_left'      => (int) $secondsLeft,
            'can_complete'      => $attendance->status === 'initiated' && $secondsLeft === 0,
            'max_progress'      => $maxProgress,
            'check_in_type'     => $checkInType,
            'window'            => $window,
            'server_time'       => $now->toIso8601String(),
            'current_streak'    => (int) ($user->current_streak ?? 0),
            'longest_streak'    => (int) ($user->longest_streak ?? 0),
            'hourly_rate_minor' => (int) ($user->hourly_rate ?? 0),
        ];
    }

    private function resolveWindow(mixed $user): array
    {
        try {
            $status = app(AttendanceService::class)->windowStatus($user);
        } catch (\Throwable) {
            $status = ['status' => 'open_on_time', 'can_check_in' => true];
        }

        return array_merge($status, [
            'open_at'     => '06:00',
            'late_from'   => '08:30',
            'checkout_by' => '20:00',
        ]);
    }
}
