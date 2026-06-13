<?php

namespace App\Services;

use App\Models\PomodoroActiveState;
use App\Models\PomodoroSession;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

/**
 * Coordinate Pomodoro timer state for guests and authenticated users.
 *
 * The service implements the UC005 sync rules: guests receive client-only timer
 * payloads, while authenticated users get persisted active-state restoration and
 * completion logging that remain consistent across devices.
 */
class PomodoroSyncService
{
    /**
     * Default Pomodoro duration in seconds.
     */
    private const DEFAULT_DURATION_SECONDS = 1500;

    /**
     * Start a new Pomodoro timer for the current actor.
     *
     * Guests receive a local-storage-only payload, while authenticated users get
     * a persisted active state that can later be restored from another device.
     *
     * @param User|null $user Authenticated user, or null for guest requests.
     * @param array<string, bool|string> $acl ACL payload resolved by middleware.
     *
     * @return array<string, bool|int|string> Timer state payload for the client.
     */
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

    /**
     * Return the current Pomodoro state for the current actor.
     *
     * For authenticated users, the remaining time is derived from persisted start
     * timestamps so the state can be reconstructed after travel between devices.
     * If an elapsed timer has finished, the service finalizes it automatically.
     *
     * @param User|null $user Authenticated user, or null for guest requests.
     * @param array<string, bool|string> $acl ACL payload resolved by middleware.
     *
     * @return array<string, bool|int|string> Current timer state payload.
     */
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

    /**
     * Finalize the current Pomodoro timer when it has fully elapsed.
     *
     * Guests receive a synthetic completion payload. Authenticated users must
     * have an active, non-paused, fully elapsed timer or the method aborts with
     * a validation-style JSON error response.
     *
     * @param User|null $user Authenticated user, or null for guest requests.
     * @param array<string, bool|string> $acl ACL payload resolved by middleware.
     *
     * @return array<string, bool|int|string|null> Completion payload for the client.
     *
     * @throws HttpResponseException When the timer is paused or still running.
     */
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

    /**
     * Calculate the remaining duration for an active timer.
     *
     * The calculation uses persisted timestamps instead of client-supplied state
     * so restored timers cannot drift after device switches or clock differences.
     *
     * @param PomodoroActiveState $activeState Persisted active timer state.
     *
     * @return int Remaining time in whole seconds, never below zero.
     */
    private function calculateRemainingSeconds(PomodoroActiveState $activeState): int
    {
        $startedAt = CarbonImmutable::parse($activeState->client_timer_started_at);
        $now = CarbonImmutable::now();
        $elapsedSeconds = max(0, $now->timestamp - $startedAt->timestamp);

        return max(0, (int) $activeState->duration_seconds - $elapsedSeconds);
    }

    /**
     * Persist a completed Pomodoro session and remove the active timer row.
     *
     * The method locks the user's active state row to avoid duplicate completion
     * records when multiple requests race to finalize the same timer.
     *
     * @param User $user Authenticated user who owns the timer.
     * @param PomodoroActiveState $activeState Active timer snapshot supplied by the caller.
     *
     * @return PomodoroSession Newly created completion record, or the latest record if already finalized.
     */
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

    /**
     * Build the client-only guest response payload.
     *
     * @return array<string, bool|int|string> Guest timer payload.
     */
    private function guestPayload(): array
    {
        return [
            'status' => 'guest',
            'duration_seconds' => self::DEFAULT_DURATION_SECONDS,
            'local_storage_only' => true,
        ];
    }
}
