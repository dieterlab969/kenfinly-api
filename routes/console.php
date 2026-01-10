<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('app:generate-sitemap')
    ->dailyAt('00:00')
    ->timezone('Asia/Ho_Chi_Minh')
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/sitemap.log'));
