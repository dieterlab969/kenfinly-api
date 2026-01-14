<?php

namespace App\Services;

use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GoogleAnalyticsService
{
    protected $client;
    protected $propertyId;
    protected $credentialsPath;

    /**
     * Constructor accepts config parameters for flexibility.
     *
     * @param string|null $propertyId
     * @param string|null $credentialsPath
     */
    public function __construct(string $propertyId = null, string $credentialsPath = null)
    {
        $this->propertyId = $propertyId ?? config('services.google_analytics.property_id');
        $this->credentialsPath = $credentialsPath ?? config('services.google_analytics.credentials_path');

        $this->initializeClient();
    }

    /**
     * Initialize Google Analytics client with error handling.
     */
    protected function initializeClient()
    {
        try {
            if (!$this->propertyId) {
                throw new \InvalidArgumentException('Google Analytics Property ID is not configured.');
            }

            if (!$this->credentialsPath || !file_exists($this->credentialsPath)) {
                throw new \InvalidArgumentException('Google Analytics credentials file not found at: ' . $this->credentialsPath);
            }

            $this->client = new BetaAnalyticsDataClient([
                'credentials' => $this->credentialsPath,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to initialize Google Analytics client: ' . $e->getMessage());
            // Re-throw to prevent silent failure
            throw $e;
        }
    }

    /**
     * Retrieve weekly traffic data, cached for 1 hour.
     *
     * @return array
     */
    public function getWeeklyTraffic(): array
    {
        return Cache::remember('analytics_weekly_traffic', 3600, function () {
            return $this->fetchTrafficData('7daysAgo', 'today');
        });
    }

    /**
     * Fetch traffic data from Google Analytics API with error handling.
     *
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    protected function fetchTrafficData(string $startDate, string $endDate): array
    {
        try {
            $response = $this->client->runReport([
                'property' => 'properties/' . $this->propertyId,
                'dateRanges' => [
                    new DateRange([
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ]),
                ],
                'dimensions' => [new Dimension(['name' => 'date'])],
                'metrics' => [
                    new Metric(['name' => 'activeUsers']),
                    new Metric(['name' => 'sessions']),
                ],
            ]);

            return $this->formatTrafficData($response);
        } catch (\Throwable $e) {
            Log::error('Google Analytics API call failed: ' . $e->getMessage());

            // Return default empty data to avoid breaking the app
            return [
                'weekly_users' => '0',
                'weekly_sessions' => '0',
                'updated_at' => now()->toIso8601String(),
                'error' => 'Failed to retrieve analytics data',
            ];
        }
    }

    /**
     * Format the raw API response into a simple array.
     *
     * @param $response
     * @return array
     */
    protected function formatTrafficData($response): array
    {
        $totalUsers = 0;
        $totalSessions = 0;

        foreach ($response->getRows() as $row) {
            $totalUsers += (int) $row->getMetricValues()[0]->getValue();
            $totalSessions += (int) $row->getMetricValues()[1]->getValue();
        }

        return [
            'weekly_users' => number_format($totalUsers),
            'weekly_sessions' => number_format($totalSessions),
            'updated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Clear cached analytics data.
     */
    public function clearCache(): void
    {
        Cache::forget('analytics_weekly_traffic');
        Cache::forget('analytics_monthly_traffic');
    }
}
