<?php

namespace App\Services;

use Google\Analytics\Data\V1beta\BetaAnalyticsDataClient;
use Google\Analytics\Data\V1beta\DateRange;
use Google\Analytics\Data\V1beta\Dimension;
use Google\Analytics\Data\V1beta\Metric;
use Illuminate\Support\Facades\Cache;

class GoogleAnalyticsService
{
    protected $client;
    protected $propertyId;

    public function __construct()
    {
        $this->propertyId = config('services.google_analytics.property_id');
        $this->client = new BetaAnalyticsDataClient([
            'credentials' => config('services.google_analytics.credentials_path')
        ]);
    }

    public function getWeeklyTraffic()
    {
         return Cache::remember('analytics_weekly_traffic', 3600, function () {
             $response = $this->client->runReport([
                 'property' => 'properties/' . $this->propertyId,
                 'dateRanges' => [
                     new DateRange([
                         'start_date' => '7daysAgo',
                         'end_date' => 'today',
                     ]),
                 ],
                 'dimensions' => [new Dimension(['name' => 'date'])],
                 'metrics' => [
                     new Metric(['name' => 'activeUsers']),
                     new Metric(['name' => 'sessions']),
                 ],
             ]);

             return $this->formatTrafficData($response);
         });
    }

    protected function formatTrafficData($response)
    {
        $totalUsers = 0;
        $totalSessions = 0;

        foreach ($response->getRows() as $row) {
            $totalUsers += $row->getMetricValues()[0]->getValue();
            $totalSessions += $row->getMetricValues()[1]->getValue();
        }

        return [
            'weekly_users' => number_format($totalUsers),
            'weekly_sessions' => number_format($totalSessions),
            'updated_at' => now()->toIso8601String()
        ];
    }

    public function clearCache()
    {
        Cache::forget('analytics_weekly_traffic');
        Cache::forget('analytics_monthly_traffic');
    }
}
