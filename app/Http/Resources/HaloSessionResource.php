<?php

namespace App\Http\Resources;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Standard 9 — Persistent Halo Countdown State.
 *
 * Returns start_time (unix timestamp) + duration (seconds) so the frontend
 * can run its own countdown without polling every second.
 * seconds_left is kept for backward compatibility.
 */
class HaloSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $attendance = $this->resource['attendance'] ?? null;
        $user       = $this->resource['user'];

        $now = CarbonImmutable::now('UTC');

        if (!$attendance) {
            return [
                'state'             => 'idle',
                'attendance'        => null,
                'start_time'        => null,
                'duration'          => null,
                'seconds_left'      => 0,
                'can_complete'      => false,
                'server_time'       => $now->toIso8601String(),
                'current_streak'    => (int) ($user->current_streak ?? 0),
                'longest_streak'    => (int) ($user->longest_streak ?? 0),
                'hourly_rate_minor' => (int) ($user->hourly_rate ?? 0),
            ];
        }

        $startedAt     = CarbonImmutable::parse($attendance->started_at)->utc();
        $expectedEndAt = CarbonImmutable::parse($attendance->expected_end_at)->utc();
        $secondsLeft   = max(0, $now->diffInSeconds($expectedEndAt, false));
        $duration      = (int) $startedAt->diffInSeconds($expectedEndAt);

        $state = match ($attendance->status) {
            'completed' => 'completed',
            'killed'    => 'killed',
            default     => $secondsLeft > 0 ? 'in_progress' : 'ready',
        };

        return [
            'state'             => $state,
            'attendance'        => (new AttendanceResource($attendance))->toArray($request),
            'start_time'        => $startedAt->timestamp,
            'duration'          => $duration,
            'seconds_left'      => (int) $secondsLeft,
            'can_complete'      => $attendance->status === 'initiated' && $secondsLeft === 0,
            'server_time'       => $now->toIso8601String(),
            'current_streak'    => (int) ($user->current_streak ?? 0),
            'longest_streak'    => (int) ($user->longest_streak ?? 0),
            'hourly_rate_minor' => (int) ($user->hourly_rate ?? 0),
        ];
    }
}
