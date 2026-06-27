<?php

namespace App\Console\Commands;

use App\Models\UserSubscription;
use App\Models\UserSubscriptionReminder;
use App\Services\SendGridService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Artisan command: subscriptions:send-reminders
 *
 * Runs daily (registered in routes/console.php at 08:00 Asia/Ho_Chi_Minh).
 * For each enabled reminder whose trigger date matches today, sends the
 * configured notification channels and stamps last_reminded_at.
 *
 * Trigger logic:
 *   today == next_billing_date - remind_before_days
 *
 * Anti-spam guard:
 *   Skips if last_reminded_at was already set today, preventing duplicate
 *   notifications on re-runs or if the scheduler fires more than once.
 *
 * Usage:
 *   php artisan subscriptions:send-reminders          # normal run
 *   php artisan subscriptions:send-reminders --dry-run  # preview without sending
 */
class SendSubscriptionReminders extends Command
{
    protected $signature = 'subscriptions:send-reminders
                            {--dry-run : Show which reminders would fire without actually sending}';

    protected $description = 'Send subscription renewal reminders for all users whose billing date matches today.';

    public function __construct(private SendGridService $sendGrid)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $today   = Carbon::today();
        $isDryRun = (bool) $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('[DRY RUN] No emails or notifications will be sent.');
        }

        $this->info("Running subscription reminders for {$today->toDateString()} …");

        // ── Load every enabled reminder together with its subscription + user ──
        $reminders = UserSubscriptionReminder::query()
            ->where('is_enabled', true)
            ->with([
                'subscription' => fn ($q) => $q
                    ->where('is_deleted', false)
                    ->where('status', 'ACTIVE')
                    ->with('user'),
            ])
            ->get()
            // Filter out reminders whose subscription was deleted/expired (eager load returned null)
            ->filter(fn ($r) => $r->subscription !== null && $r->subscription->user !== null);

        $this->info("Loaded {$reminders->count()} enabled reminder(s) with active subscriptions.");

        $sent    = 0;
        $skipped = 0;
        $failed  = 0;

        foreach ($reminders as $reminder) {
            $subscription = $reminder->subscription;
            $user         = $subscription->user;

            // ── Trigger date check: today must equal billing_date - remind_before_days ──
            // Parse only the date portion (Y-m-d string) to avoid UTC/timezone drift
            // that occurs when Carbon::parse() is given a full datetime with offset.
            $billingDate  = Carbon::createFromFormat('Y-m-d', $subscription->next_billing_date->toDateString());
            $triggerDate  = $billingDate->copy()->subDays($reminder->remind_before_days);

            if (!$triggerDate->isSameDay($today)) {
                $skipped++;
                continue;
            }

            // ── Anti-spam: skip if already reminded today ──
            if ($reminder->last_reminded_at !== null &&
                Carbon::parse($reminder->last_reminded_at)->isSameDay($today)) {
                $this->line("  SKIP  [{$user->email}] {$subscription->service_name} — already reminded today.");
                $skipped++;
                continue;
            }

            $this->line("  FIRE  [{$user->email}] {$subscription->service_name}"
                . " — billing on {$billingDate->toDateString()}"
                . " — channels: " . implode(', ', $reminder->channels));

            if ($isDryRun) {
                $sent++;
                continue;
            }

            // ── Dispatch each channel ──
            $dispatched = false;

            foreach ($reminder->channels as $channel) {
                try {
                    match ($channel) {
                        'email' => $this->sendEmailReminder($user, $subscription, $reminder),
                        'push'  => $this->sendPushReminder($user, $subscription, $reminder),
                        default => Log::warning('subscriptions:send-reminders — unknown channel', [
                            'channel'         => $channel,
                            'reminder_id'     => $reminder->id,
                            'subscription_id' => $subscription->id,
                        ]),
                    };
                    $dispatched = true;
                } catch (\Throwable $e) {
                    $failed++;
                    Log::error('subscriptions:send-reminders — channel dispatch failed', [
                        'channel'         => $channel,
                        'reminder_id'     => $reminder->id,
                        'subscription_id' => $subscription->id,
                        'user_id'         => $user->id,
                        'error'           => $e->getMessage(),
                    ]);
                    $this->error("  ERROR [{$channel}] {$user->email} — {$e->getMessage()}");
                }
            }

            // ── Stamp last_reminded_at only when at least one channel succeeded ──
            if ($dispatched) {
                $reminder->update(['last_reminded_at' => now()]);
                $sent++;
            }
        }

        $this->info("Done. sent={$sent} skipped={$skipped} failed={$failed}");

        Log::info('subscriptions:send-reminders completed', [
            'date'    => $today->toDateString(),
            'sent'    => $sent,
            'skipped' => $skipped,
            'failed'  => $failed,
            'dry_run' => $isDryRun,
        ]);

        return self::SUCCESS;
    }

    // ─── Email channel ─────────────────────────────────────────────────────────

    private function sendEmailReminder(
        \App\Models\User $user,
        UserSubscription $subscription,
        UserSubscriptionReminder $reminder
    ): void {
        $this->sendGrid->sendSubscriptionReminderEmail(
            to:                $user->email,
            name:              $user->name ?? $user->email,
            serviceName:       $subscription->service_name,
            amount:            (float) $subscription->amount,
            currency:          $subscription->currency,
            billingCycle:      $subscription->billing_cycle,
            nextBillingDate:   Carbon::parse($subscription->next_billing_date),
            remindBeforeDays:  $reminder->remind_before_days,
        );

        Log::info('subscriptions:send-reminders — email sent', [
            'user_id'         => $user->id,
            'subscription_id' => $subscription->id,
            'service_name'    => $subscription->service_name,
        ]);
    }

    // ─── Push channel ──────────────────────────────────────────────────────────

    /**
     * Send an in-app / push notification.
     *
     * Placeholder: logs the intent. Wire a real push provider here when ready
     * (e.g. Firebase Cloud Messaging via a device-token stored on the user model,
     * or a Laravel Notification channel like laravel-notification-channels/fcm).
     */
    private function sendPushReminder(
        \App\Models\User $user,
        UserSubscription $subscription,
        UserSubscriptionReminder $reminder
    ): void {
        Log::info('subscriptions:send-reminders — push notification (pending provider)', [
            'user_id'            => $user->id,
            'subscription_id'    => $subscription->id,
            'service_name'       => $subscription->service_name,
            'next_billing_date'  => Carbon::parse($subscription->next_billing_date)->toDateString(),
            'remind_before_days' => $reminder->remind_before_days,
        ]);

        // TODO: integrate push provider, e.g.:
        //   FCM::sendToDevice($user->fcm_token, [
        //       'title' => "Renewal reminder: {$subscription->service_name}",
        //       'body'  => "Your subscription renews in {$reminder->remind_before_days} day(s).",
        //   ]);
    }
}
