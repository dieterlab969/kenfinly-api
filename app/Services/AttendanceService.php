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
 * Halo attendance lifecycle — Invisible Design (single-button, auto-close).
 *
 * Implements:
 *  - Standard 1  (UTC normalization; halo_date computed in user's local tz).
 *  - Standard 4  (write-time ledger rollup via LedgerSummaryService on reward).
 *  - Standard 6  (race-safe HELLO via UNIQUE(user_id, halo_date) + QueryException catch).
 *  - Standard 9  (status reads expected_end_at from DB; frontend timers are display-only).
 *
 * Duration logic (per spec):
 *  - At/before 12:00 PM local  →  8 h  (28 800 s)  — full ring
 *  - After     12:00 PM local  →  min(4 h, seconds until local midnight)
 *
 * Auto-close: status() lazily seals any 'initiated' session whose expected_end_at
 * has passed and writes one idempotent row to halo_histories.
 */
class AttendanceService
{
    private const SECS_FULL = 28_800; // 8 h — pre-noon allocation
    private const SECS_HALF = 14_400; // 4 h — post-noon cap

    public function __construct(private readonly LedgerSummaryService $ledgerSummary)
    {
    }

    /* ─────────────────────────────────────────────────────────
       PUBLIC API
    ───────────────────────────────────────────────────────── */

    public function status(User $user): array
    {
        $haloDate   = $this->todayFor($user);
        $attendance = Attendance::where('user_id', $user->id)
            ->whereDate('halo_date', $haloDate)
            ->with('rewardTransaction')
            ->first();

        // Lazy auto-close: seal expired initiated sessions without a background job.
        if ($attendance && $attendance->status === 'initiated') {
            $now         = CarbonImmutable::now('UTC');
            $expectedEnd = CarbonImmutable::parse($attendance->expected_end_at)->utc();
            if ($now->gte($expectedEnd)) {
                $this->autoClose($attendance, $user);
                $attendance = $attendance->fresh(['rewardTransaction']);
            }
        }

        return [
            'user'       => $user->fresh(),
            'attendance' => $attendance,
        ];
    }

    public function start(User $user): array
    {
        $haloDate = $this->todayFor($user);

        try {
            DB::transaction(function () use ($user, $haloDate) {
                $existing = Attendance::where('user_id', $user->id)
                    ->whereDate('halo_date', $haloDate)
                    ->lockForUpdate()
                    ->first();

                if ($existing) {
                    logger()->info('AttendanceService.start existing session detected', [
                        'user_id' => $user->id,
                        'attendance_id' => $existing->id,
                    ]);
                    return; // Already started today — return existing state.
                }

                $startedAt     = CarbonImmutable::now('UTC');
                $duration      = $this->calculateDuration($user, $startedAt);
                $expectedEndAt = $startedAt->addSeconds($duration);

                $attendance = Attendance::create([
                    'user_id'         => $user->id,
                    'halo_date'       => $haloDate,
                    'status'          => 'initiated',
                    'started_at'      => $startedAt,
                    'expected_end_at' => $expectedEndAt,
                    'quote_text'      => $this->dailyQuote($haloDate),
                    'reminder_due_at' => $this->reminderDueAt($user, $haloDate),
                ]);

                logger()->info('AttendanceService.start created session', [
                    'user_id' => $user->id,
                    'attendance_id' => $attendance->id,
                    'started_at' => $startedAt->toIso8601String(),
                    'expected_end_at' => $expectedEndAt->toIso8601String(),
                ]);
            });
        } catch (QueryException $e) {
            // Standard 6 — race-condition duplicate; UNIQUE constraint already rejected it.
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
                    'attendance' => 'The Halo session can only be completed after the timer has finished.',
                ]);
            }

            $rewardAmountMinor = $this->calculateRewardAmountMinor($user, $attendance, $now);
            $rewardTransaction  = $this->createRewardTransaction($user, $attendance, $rewardAmountMinor);

            logger()->info('AttendanceService.complete reward transaction created', [
                'user_id' => $user->id,
                'attendance_id' => $attendance->id,
                'transaction_id' => $rewardTransaction->id,
                'reward_amount_minor' => $rewardAmountMinor,
            ]);

            $attendance->forceFill([
                'status'                => 'completed',
                'ended_at'              => $now,
                'user_rating'           => $rating,
                'quote_vote'            => $quoteVote,
                'earned_amount'         => $rewardAmountMinor,
                'reward_transaction_id' => $rewardTransaction->id,
            ])->save();

            $this->writeHaloHistory($attendance, $user, $now);
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

    /* ─────────────────────────────────────────────────────────
       DURATION CALCULATION  (12:00 PM threshold)
    ───────────────────────────────────────────────────────── */

    /**
     * Returns seconds the session should run, based on the user's local time.
     *
     *  - At/before 12:00 PM  →  28 800 s (8 h, full ring)
     *  - After     12:00 PM  →  min(14 400 s, seconds remaining until local midnight)
     */
    private function calculateDuration(User $user, CarbonImmutable $startedAtUtc): int
    {
        $tz       = $user->timezone ?: config('app.timezone', 'UTC');
        $localNow = $startedAtUtc->setTimezone($tz);
        $noon     = $localNow->setTime(12, 0, 0);

        if ($localNow->lte($noon)) {
            return self::SECS_FULL;
        }

        // After noon: capped at 4 h, also capped at time remaining until midnight.
        $midnight          = $localNow->addDay()->setTime(0, 0, 0);
        $secsUntilMidnight = (int) $startedAtUtc->diffInSeconds($midnight->utc(), false);

        return min(self::SECS_HALF, max(0, $secsUntilMidnight));
    }

    /* ─────────────────────────────────────────────────────────
       AUTO-CLOSE  (lazy midnight expiry, no background job needed)
    ───────────────────────────────────────────────────────── */

    private function autoClose(Attendance $attendance, User $user): void
    {
        DB::transaction(function () use ($attendance, $user) {
            $locked = Attendance::where('id', $attendance->id)
                ->lockForUpdate()
                ->first();

            if (!$locked || $locked->status !== 'initiated') {
                return; // Another process already closed it.
            }

            $endedAt = CarbonImmutable::now('UTC');

            $locked->forceFill([
                'status'   => 'completed',
                'ended_at' => $endedAt,
            ])->save();

            $this->writeHaloHistory($locked, $user, $endedAt);
            $this->updateStreak($user, $locked);
        });
    }

    /* ─────────────────────────────────────────────────────────
       HALO HISTORIES  (persistent layer — upsert, idempotent)
    ───────────────────────────────────────────────────────── */

    private function writeHaloHistory(Attendance $attendance, User $user, CarbonImmutable $endedAt): void
    {
        $startedAt     = CarbonImmutable::parse($attendance->started_at)->utc();
        $expectedEnd   = CarbonImmutable::parse($attendance->expected_end_at)->utc();
        $maxSeconds    = (int) $startedAt->diffInSeconds($expectedEnd);
        $actualSeconds = min($maxSeconds, (int) $startedAt->diffInSeconds($endedAt));

        DB::table('halo_histories')->updateOrInsert(
            ['user_id' => $user->id, 'date' => $attendance->halo_date->toDateString()],
            ['actual_seconds' => $actualSeconds, 'max_seconds' => $maxSeconds, 'created_at' => now()]
        );
    }

    /* ─────────────────────────────────────────────────────────
       PRIVATE HELPERS
    ───────────────────────────────────────────────────────── */

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
        $startedAt       = CarbonImmutable::parse($attendance->started_at)->utc();
        $expectedEnd     = CarbonImmutable::parse($attendance->expected_end_at)->utc();
        $sessionMinutes  = (int) $startedAt->diffInMinutes($expectedEnd);
        $minutesWorked   = max($sessionMinutes, (int) $startedAt->diffInMinutes($endedAt, false));
        $hourlyRateMinor = (int) ($user->hourly_rate ?? 100_000);

        return intdiv($minutesWorked * $hourlyRateMinor, 60);
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
                'notes'            => 'Halo completion reward',
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
