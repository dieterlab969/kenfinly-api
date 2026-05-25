<?php

namespace App\Http\Resources;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Standard 9 — Persistent Halo Countdown State.
 *
 * Always derives remaining seconds from the database `expected_end_at`, never from
 * client-supplied state. Frontend timers are visual only.
 */
class HaloSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attendance = $this->resource['attendance'] ?? null;
        $user = $this->resource['user'];

        if (!$attendance) {
            return [
                'state' => 'idle',
                'attendance' => null,
                'seconds_left' => 0,
                'can_complete' => false,
                'server_time' => CarbonImmutable::now('UTC')->toIso8601String(),
                'current_streak' => (int) ($user->current_streak ?? 0),
                'longest_streak' => (int) ($user->longest_streak ?? 0),
                'hourly_rate_minor' => (int) ($user->hourly_rate ?? 0),
            ];
        }

        $expectedEndAt = CarbonImmutable::parse($attendance->expected_end_at)->utc();
        $now = CarbonImmutable::now('UTC');
        $secondsLeft = max(0, $now->diffInSeconds($expectedEndAt, false));

        $state = match ($attendance->status) {
            'completed' => 'completed',
            'killed' => 'killed',
            default => $secondsLeft > 0 ? 'in_progress' : 'ready',
        };

        return [
            'state' => $state,
            'attendance' => (new AttendanceResource($attendance))->toArray($request),
            'seconds_left' => (int) $secondsLeft,
            'can_complete' => $attendance->status === 'initiated' && $secondsLeft === 0,
            'server_time' => $now->toIso8601String(),
            'current_streak' => (int) ($user->current_streak ?? 0),
            'longest_streak' => (int) ($user->longest_streak ?? 0),
            'hourly_rate_minor' => (int) ($user->hourly_rate ?? 0),
        ];
    }
}
