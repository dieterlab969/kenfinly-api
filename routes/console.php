<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Illuminate\Foundation\Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:generate-sitemap')
    ->dailyAt('00:00')
    ->timezone('Asia/Ho_Chi_Minh')
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/sitemap.log'));

// orders:expire — DISABLED. The orders/shopping_cart/payos_payment_orders tables
// were dropped (migration 2026_06_19_000001) when checkout moved fully to WooCommerce.
// Do not re-enable without restoring those tables first.
// Schedule::command('orders:expire')->everyMinute();

// Subscription renewal reminders — fires daily at 08:00 Ho Chi Minh time.
// Queries user_subscription_reminders for rows due today, dispatches email/push
// per the channels JSON column, and stamps last_reminded_at to prevent re-sending.
// Use --dry-run flag locally to preview without sending: php artisan subscriptions:send-reminders --dry-run
Schedule::command('subscriptions:send-reminders')
    ->dailyAt('08:00')
    ->timezone('Asia/Ho_Chi_Minh')
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/subscription-reminders.log'))
    ->onFailure(function () {
        \Illuminate\Support\Facades\Log::error('subscriptions:send-reminders scheduled run failed.');
    });
