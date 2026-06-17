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

// Expire pending orders whose 5-minute window has elapsed.
Schedule::command('orders:expire')
    ->everyMinute()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/orders-expire.log'));
