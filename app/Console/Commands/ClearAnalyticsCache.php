<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\GoogleAnalyticsService;
use Illuminate\Support\Facades\Log;

class ClearAnalyticsCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analytics:clear-cache';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear cached analytics data';

    /**
     * Execute the console command.
     *
     * @param GoogleAnalyticsService $analyticsService
     * @return int
     */
    public function handle(GoogleAnalyticsService $analyticsService): int
    {
        if (!$this->confirm('Are you sure you want to clear the analytics cache?')) {
            $this->info('Cache clearing aborted.');
            return Command::SUCCESS;
        }

        try {
            $analyticsService->clearCache();

            $this->info('Analytics cache cleared successfully!');
            Log::info('Analytics cache cleared via artisan command.', [
                'command' => 'analytics:clear-cache',
                'timestamp' => now()->toDateTimeString(),
                'user' => get_current_user(),
            ]);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Failed to clear analytics cache: ' . $e->getMessage());
            Log::error('Failed to clear analytics cache.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'command' => 'analytics:clear-cache',
                'timestamp' => now()->toDateTimeString(),
                'user' => get_current_user(),
            ]);

            return Command::FAILURE;
        }
    }
}
