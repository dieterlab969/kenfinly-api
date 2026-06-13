<?php

namespace App\Services;

use App\Models\PomodoroActiveState;
use App\Models\PomodoroSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class PomodoroSyncService
{
    private const DEFAULT_DURATION_SECONDS = 1500;

    public function start(?User $user, array $acl): array
    {
        if ($acl['role'] === 'guest') {
            return $this->guestPayload();
        }

        $now = CarbonImmutable::now();

        PomodoroActiveState::updateOrCreate(
            ['user_id' => $user->id],
            [
                'client_timer_started_at' => $now,
                'duration_seconds' => self::DEFAULT_DURATION_SECONDS,
                'is_paused' => false,
                'remaining_seconds' => null,
                'updated_at' => $now,
            ]
        );

        return [
            'status' => 'running',
            'remaining_seconds' => self::DEFAULT_DURATION_SECONDS,
            'local_storage_only' => false,
        ];
    }

    public function state(?User $user, array $acl): array
    {
        if ($acl['role'] === 'guest') {
            return [
                'status' => 'idle',
                'completed_trigger' => false,
                'local_storage_only' => true,
            ];
        }

        $activeState = PomodoroActiveState::where('user_id', $user->id)->first();

        if (!$activeState) {
            return [
                'status' => 'idle',
                'completed_trigger' => false,
                'local_storage_only' => false,
            ];
        }

        if ($activeState->is_paused) {
            return [
                'status' => 'paused',
                'remaining_seconds' => (int) $activeState->remaining_seconds,
                'completed_trigger' => false,
                'local_storage_only' => false,
            ];
        }

        $remainingSeconds = $this->calculateRemainingSeconds($activeState);

        if ($remainingSeconds > 0) {
            return [
                'status' => 'running',
                'remaining_seconds' => $remainingSeconds,
                'completed_trigger' => false,
                'local_storage_only' => false,
            ];
        }

        $this->persistCompletedSession($user, $activeState);

        return [
            'status' => 'idle',
            'completed_trigger' => true,
            'local_storage_only' => false,
        ];
    }

    public function complete(?User $user, array $acl): array
    {
        if ($acl['role'] === 'guest') {
            return [
                'status' => 'idle',
                'completed_trigger' => true,
                'local_storage_only' => true,
            ];
        }

        $activeState = PomodoroActiveState::where('user_id', $user->id)->first();

        if (!$activeState) {
            return [
                'status' => 'idle',
                'completed_trigger' => false,
                'local_storage_only' => false,
            ];
        }

        if ($activeState->is_paused) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Pomodoro timer is paused and cannot be completed yet.',
            ], 422));
        }

        $remainingSeconds = $this->calculateRemainingSeconds($activeState);

        if ($remainingSeconds > 0) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'message' => 'Pomodoro timer is still running.',
                'remaining_seconds' => $remainingSeconds,
            ], 422));
        }

        $session = $this->persistCompletedSession($user, $activeState);

        return [
            'status' => 'idle',
            'completed_trigger' => true,
            'completed_at' => optional($session->completed_at)->toIso8601String(),
            'local_storage_only' => false,
        ];
    }

    private function calculateRemainingSeconds(PomodoroActiveState $activeState): int
    {
        $startedAt = CarbonImmutable::parse($activeState->client_timer_started_at);
        $now = CarbonImmutable::now();
        $elapsedSeconds = max(0, $now->timestamp - $startedAt->timestamp);

        return max(0, (int) $activeState->duration_seconds - $elapsedSeconds);
    }

    private function persistCompletedSession(User $user, PomodoroActiveState $activeState): PomodoroSession
    {
        return DB::transaction(function () use ($user, $activeState) {
            $lockedState = PomodoroActiveState::where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$lockedState) {
                return PomodoroSession::where('user_id', $user->id)
                    ->orderByDesc('id')
                    ->firstOrFail();
            }

            $startedAt = CarbonImmutable::parse($lockedState->client_timer_started_at);
            $completedAt = $startedAt->addSeconds((int) $lockedState->duration_seconds);

            $session = PomodoroSession::create([
                'user_id' => $user->id,
                'started_at' => $startedAt,
                'completed_at' => $completedAt,
                'status' => 'completed',
            ]);

            $lockedState->delete();

            return $session;
        });
    }

    private function guestPayload(): array
    {
        return [
            'status' => 'guest',
            'duration_seconds' => self::DEFAULT_DURATION_SECONDS,
            'local_storage_only' => true,
        ];
    }
}
