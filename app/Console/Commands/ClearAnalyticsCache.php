<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GoogleAnalyticsService;
class ClearAnalyticsCache extends Command
{
    protected $signature = 'analytics:clear-cache';
    protected $description = 'Clear cached analytics data';

    public function handle(GoogleAnalyticsService $analyticsService)
    {
        $analyticsService->clearCache();

        $this->info('Analytics cache cleared successfully!');

        return Command::SUCCESS;
    }
}
