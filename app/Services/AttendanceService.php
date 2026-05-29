<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Attendance;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Halo attendance lifecycle: HELLO → 8-hour session → DONE/KILL.
 *
 * Check-in time rules (enforced in user's local timezone):
 *   06:00 – 08:30  → on_time  → ring can reach 100%
 *   After 08:30    → late     → half-day absence, ring capped at 50%
 *   Before 06:00   → rejected (window not open yet)
 *
 * Check-out rules:
 *   Users must complete (click Done) before 20:00 local time.
 *   Reminders fire at 20:00 and 20:30 (max 2).
 *   Sessions still open at 22:00 are auto-killed by ProcessHaloReminders.
 */
class AttendanceService
{
    private const SESSION_HOURS = 8;

    // Check-in window boundaries (minutes-of-day in user's local tz)
    private const WINDOW_OPEN_MINUTE = 360;  //  6:00 AM
    private const WINDOW_LATE_MINUTE = 510;  //  8:30 AM

    public function __construct(private readonly LedgerSummaryService $ledgerSummary)
    {
    }

    public function status(User $user): array
    {
        $haloDate = $this->todayFor($user);
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('halo_date', $haloDate)
            ->with('rewardTransaction')
            ->first();

        return [
            'user'       => $user->fresh(),
            'attendance' => $attendance,
        ];
    }

    public function start(User $user): array
    {
        $haloDate  = $this->todayFor($user);
        $tz        = $user->timezone ?: config('app.timezone', 'UTC');
        $localNow  = CarbonImmutable::now($tz);
        $minuteOfDay = $localNow->hour * 60 + $localNow->minute;

        // ── Enforce check-in window ────────────────────────────────────────
        if ($minuteOfDay < self::WINDOW_OPEN_MINUTE) {
            throw ValidationException::withMessages([
                'attendance' => 'The check-in window has not opened yet. Halo check-in is available from 06:00 AM.',
            ]);
        }

        $checkInType = $minuteOfDay <= self::WINDOW_LATE_MINUTE ? 'on_time' : 'late';

        try {
            DB::transaction(function () use ($user, $haloDate, $checkInType) {
                $existing = Attendance::where('user_id', $user->id)
                    ->whereDate('halo_date', $haloDate)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    return;
                }

                $startedAt     = CarbonImmutable::now('UTC');
                $expectedEndAt = $startedAt->addHours(self::SESSION_HOURS);

                Attendance::create([
                    'user_id'        => $user->id,
                    'halo_date'      => $haloDate,
                    'status'         => 'initiated',
                    'check_in_type'  => $checkInType,
                    'started_at'     => $startedAt,
                    'expected_end_at'=> $expectedEndAt,
                    'quote_text'     => $this->dailyQuote($haloDate),
                    'reminder_due_at'=> $this->reminderDueAt($user, $haloDate),
                    'reminder_count' => 0,
                ]);
            });
        } catch (QueryException $e) {
            if (!$this->isDuplicateKeyError($e)) {
                throw $e;
            }
        }

        return $this->status($user);
    }

    public function complete(User $user, ?string $rating = null, ?string $quoteVote = null): array
    {
        DB::transaction(function () use ($user, $rating, $quoteVote) {
            $attendance = $this->lockTodayAttendance($user);

            if (!$attendance || $attendance->status !== 'initiated') {
                throw ValidationException::withMessages([
                    'attendance' => 'No active Halo session is ready to complete.',
                ]);
            }

            $now         = CarbonImmutable::now('UTC');
            $expectedEnd = CarbonImmutable::parse($attendance->expected_end_at)->utc();

            if ($now->lt($expectedEnd)) {
                throw ValidationException::withMessages([
                    'attendance' => 'The Halo session can only be completed after the 8-hour timer has finished.',
                ]);
            }

            $rewardAmountMinor = $this->calculateRewardAmountMinor($user, $attendance, $now);
            $rewardTransaction = $this->createRewardTransaction($user, $attendance, $rewardAmountMinor);

            $attendance->forceFill([
                'status'               => 'completed',
                'ended_at'             => $now,
                'user_rating'          => $rating,
                'quote_vote'           => $quoteVote,
                'earned_amount'        => $rewardAmountMinor,
                'reward_transaction_id'=> $rewardTransaction->id,
            ])->save();

            $this->updateStreak($user, $attendance);
            $this->ledgerSummary->applyTransaction($rewardTransaction);
        });

        return $this->status($user);
    }

    public function kill(User $user, ?string $reason = null): array
    {
        DB::transaction(function () use ($user, $reason) {
            $attendance = $this->lockTodayAttendance($user);

            if (!$attendance || $attendance->status !== 'initiated') {
                throw ValidationException::withMessages([
                    'attendance' => 'No active Halo session is available to kill.',
                ]);
            }

            $attendance->forceFill([
                'status'      => 'killed',
                'ended_at'    => CarbonImmutable::now('UTC'),
                'kill_reason' => $reason,
            ])->save();
        });

        return $this->status($user);
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    /**
     * Compute the current window status for a given user (used by the resource).
     *
     * @return array{status: string, can_check_in: bool}
     */
    public function windowStatus(User $user): array
    {
        $tz          = $user->timezone ?: config('app.timezone', 'UTC');
        $localNow    = CarbonImmutable::now($tz);
        $minuteOfDay = $localNow->hour * 60 + $localNow->minute;

        if ($minuteOfDay < self::WINDOW_OPEN_MINUTE) {
            return ['status' => 'too_early',    'can_check_in' => false];
        }
        if ($minuteOfDay <= self::WINDOW_LATE_MINUTE) {
            return ['status' => 'open_on_time', 'can_check_in' => true];
        }
        return     ['status' => 'open_late',    'can_check_in' => true];
    }

    private function lockTodayAttendance(User $user): ?Attendance
    {
        return Attendance::where('user_id', $user->id)
            ->whereDate('halo_date', $this->todayFor($user))
            ->lockForUpdate()
            ->first();
    }

    private function todayFor(User $user): string
    {
        $tz = $user->timezone ?: config('app.timezone', 'UTC');
        return CarbonImmutable::now($tz)->toDateString();
    }

    private function reminderDueAt(User $user, string $haloDate): CarbonImmutable
    {
        $tz = $user->timezone ?: config('app.timezone', 'UTC');
        return CarbonImmutable::parse($haloDate . ' 20:00:00', $tz)->utc();
    }

    private function calculateRewardAmountMinor(User $user, Attendance $attendance, CarbonImmutable $endedAt): int
    {
        $startedAt     = CarbonImmutable::parse($attendance->started_at)->utc();
        $minutesWorked = max(self::SESSION_HOURS * 60, $startedAt->diffInMinutes($endedAt, false));
        $hourlyRateMinor = (int) ($user->hourly_rate ?? 100000);

        $baseAmount = intdiv($minutesWorked * $hourlyRateMinor, 60);

        // Half-day penalty: late check-ins earn 50% of the normal reward
        if ($attendance->check_in_type === 'late') {
            return intdiv($baseAmount, 2);
        }

        return $baseAmount;
    }

    private function createRewardTransaction(User $user, Attendance $attendance, int $amountMinor): Transaction
    {
        $account = $user->accounts()->first() ?: Account::create([
            'user_id'  => $user->id,
            'name'     => 'My Wallet',
            'balance'  => 0,
            'currency' => 'VND',
            'icon'     => '💰',
            'color'    => '#3b82f6',
        ]);

        $category = Category::firstOrCreate(
            ['slug' => 'halo-reward'],
            [
                'name'  => 'Halo Reward',
                'icon'  => '⚡',
                'color' => '#7C3AED',
                'type'  => 'income',
            ]
        );

        $idempotencyKey = hash('sha256', 'halo_reward:' . $attendance->id);

        $transaction = Transaction::firstOrCreate(
            ['user_id' => $user->id, 'idempotency_key' => $idempotencyKey],
            [
                'account_id'       => $account->id,
                'category_id'      => $category->id,
                'type'             => 'income',
                'ledger_type'      => 'halo',
                'amount'           => $amountMinor,
                'amount_minor'     => $amountMinor,
                'notes'            => $attendance->check_in_type === 'late'
                                        ? 'Halo 8-hour completion reward (half-day)'
                                        : 'Halo 8-hour completion reward',
                'transaction_date' => $attendance->halo_date,
                'currency'         => $account->currency ?: 'VND',
                'source_type'      => 'halo_reward',
                'source_id'        => $attendance->id,
            ]
        );

        if ($transaction->wasRecentlyCreated) {
            $account->increment('balance', $amountMinor);
        }

        return $transaction;
    }

    private function updateStreak(User $user, Attendance $attendance): void
    {
        $haloDate     = CarbonImmutable::parse($attendance->halo_date)->toDateString();
        $lastHaloDate = $user->last_halo_date
            ? CarbonImmutable::parse($user->last_halo_date)->toDateString()
            : null;
        $yesterday = CarbonImmutable::parse($haloDate)->subDay()->toDateString();

        if ($lastHaloDate === $haloDate) {
            return;
        }

        $currentStreak = $lastHaloDate === $yesterday
            ? ((int) $user->current_streak) + 1
            : 1;

        $user->forceFill([
            'current_streak' => $currentStreak,
            'longest_streak' => max((int) $user->longest_streak, $currentStreak),
            'last_halo_date' => $haloDate,
        ])->save();
    }

    private function dailyQuote(string $haloDate): string
    {
        $quotes = [
            'Protect the first hour and the rest of the day gets easier.',
            'A focused block compounds faster than scattered effort.',
            'Finish the session you promised yourself.',
            "Your future ledger is written by today's discipline.",
            'Keep the promise small, visible, and complete.',
        ];

        return $quotes[crc32($haloDate) % count($quotes)];
    }

    private function isDuplicateKeyError(QueryException $e): bool
    {
        $code    = (string) $e->getCode();
        $message = $e->getMessage();
        return $code === '23000'
            || $code === '23505'
            || str_contains($message, 'UNIQUE constraint failed')
            || str_contains($message, 'Duplicate entry');
    }
}
