<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GoogleAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PublicAnalyticsController extends Controller
{
      protected $analyticsService;

     public function __construct(GoogleAnalyticsService $analyticsService)
    {
          $this->analyticsService = $analyticsService;
    }

    /**
     * Get combined weekly and monthly public statistics.
     *
     * This endpoint returns both weekly and monthly traffic data in one response,
     * reducing frontend complexity and API calls.
     * It also sets HTTP cache headers to improve performance.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getPublicStats(Request $request)
    {
        if (!config('wordpress.traffic_stats.enabled')) {
            return response()->json([
                'success' => false,
                'message' => 'Traffic statistics are currently disabled.',
            ], Response::HTTP_FORBIDDEN);
        }

        try {
            $weeklyStats = $this->analyticsService->getWeeklyTraffic();
            $monthlyStats = $this->analyticsService->getMonthlyTraffic();

            $data = [
                'weekly' => $weeklyStats,
                'monthly' => $monthlyStats,
            ];

            // Create JSON response with caching headers (cache for 5 minutes)
            return response()->json([
                'success' => true,
                'data' => $data,
            ])->header('Cache-Control', 'public, max-age=300, s-maxage=300, must-revalidate');
        } catch (\Exception $e) {
            Log::error('Failed to retrieve combined analytics stats', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_ip' => $request->ip(),
                'timestamp' => now()->toDateTimeString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to retrieve analytics data at this time.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
