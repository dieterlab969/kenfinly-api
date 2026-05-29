<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Services\SendGridService;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * ProcessHaloReminders
 *
 * Scheduled every 15 minutes. Handles two phases:
 *
 *  Phase 1 — Reminder emails (max 2 per session):
 *    • Finds sessions that are "ready" (8-hr timer expired) but not completed.
 *    • Sends reminder #1 at 20:00 (user's local tz).
 *    • Sends reminder #2 at 20:30 (+30 min after first).
 *    • After #2, sets reminder_due_at to 22:00 (auto-kill window).
 *
 *  Phase 2 — Auto-kill:
 *    • Finds sessions that received both reminders and are still open past
 *      their 22:00 auto-kill time.
 *    • Marks them 'killed' with reason 'auto_kill_forgot_checkout'.
 *    • Users lose their attendance circle for that day — no exceptions.
 */
class ProcessHaloReminders extends Command
{
    protected $signature   = 'halo:process-reminders';
    protected $description = 'Send checkout reminder emails and auto-kill overdue Halo sessions.';

    private const REMINDER_GAP_MINUTES  = 30;   // gap between reminder 1 and reminder 2
    private const AUTOKILL_DELAY_MINUTES = 90;   // gap between reminder 2 and auto-kill (20:30 → 22:00)

    public function __construct(private readonly SendGridService $sendGrid)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->processReminders();
        $this->autoKillOverdue();
        return Command::SUCCESS;
    }

    // ── Phase 1: Send reminder emails ─────────────────────────────────────

    private function processReminders(): void
    {
        DB::transaction(function () {
            $sessions = Attendance::query()
                ->where('status', 'initiated')
                ->where('expected_end_at', '<=', CarbonImmutable::now('UTC'))  // session is completable
                ->where('reminder_due_at',  '<=', CarbonImmutable::now('UTC')) // reminder window reached
                ->where('reminder_count', '<', 2)                               // haven't sent 2 yet
                ->with('user')
                ->lockForUpdate()
                ->get();

            foreach ($sessions as $attendance) {
                $user = $attendance->user;
                if (!$user) {
                    continue;
                }

                $reminderNumber = $attendance->reminder_count + 1;

                // Calculate next reminder_due_at
                $nextDue = $reminderNumber === 1
                    ? CarbonImmutable::parse($attendance->reminder_due_at)->addMinutes(self::REMINDER_GAP_MINUTES)
                    : CarbonImmutable::parse($attendance->reminder_due_at)->addMinutes(self::AUTOKILL_DELAY_MINUTES);

                $attendance->forceFill([
                    'reminder_count'   => $reminderNumber,
                    'reminder_sent_at' => CarbonImmutable::now('UTC'),
                    'reminder_due_at'  => $nextDue,
                ])->save();

                $this->sendReminderEmail($user, $reminderNumber);

                Log::info('Halo checkout reminder sent', [
                    'user_id'         => $user->id,
                    'attendance_id'   => $attendance->id,
                    'reminder_number' => $reminderNumber,
                    'halo_date'       => $attendance->halo_date,
                ]);
            }

            $count = $sessions->count();
            if ($count > 0) {
                $this->info("Sent {$count} checkout reminder(s).");
            }
        });
    }

    // ── Phase 2: Auto-kill overdue sessions ───────────────────────────────

    private function autoKillOverdue(): void
    {
        DB::transaction(function () {
            $sessions = Attendance::query()
                ->where('status', 'initiated')
                ->where('reminder_count', '>=', 2)
                ->where('reminder_due_at', '<=', CarbonImmutable::now('UTC'))
                ->lockForUpdate()
                ->get();

            foreach ($sessions as $attendance) {
                $attendance->forceFill([
                    'status'      => 'killed',
                    'ended_at'    => CarbonImmutable::now('UTC'),
                    'kill_reason' => 'auto_kill_forgot_checkout',
                ])->save();

                Log::warning('Halo session auto-killed: forgot to check out', [
                    'user_id'       => $attendance->user_id,
                    'attendance_id' => $attendance->id,
                    'halo_date'     => $attendance->halo_date,
                ]);
            }

            $count = $sessions->count();
            if ($count > 0) {
                $this->warn("Auto-killed {$count} overdue session(s).");
            }
        });
    }

    // ── Email dispatch ─────────────────────────────────────────────────────

    private function sendReminderEmail(mixed $user, int $reminderNumber): void
    {
        try {
            $this->sendGrid->sendCheckoutReminder(
                to:             $user->email,
                userName:       $user->name,
                reminderNumber: $reminderNumber,
            );
        } catch (\Throwable $e) {
            // Never let a failed email crash the command — just log and continue.
            Log::error('Failed to send Halo checkout reminder email', [
                'user_id'  => $user->id,
                'reminder' => $reminderNumber,
                'error'    => $e->getMessage(),
            ]);
        }
    }
}
