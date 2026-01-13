<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GoogleAnalyticsService;
use Illuminate\Http\Request;

class PublicAnalyticsController extends Controller
{
      protected $analyticsService;

     public function __construct(GoogleAnalyticsService $analyticsService)
    {
          $this->analyticsService = $analyticsService;
    }

     public function getPublicStats(Request $request)
    {
        try {
            // Public stats don't require consent - they're aggregate data
            $stats = $this->analyticsService->getWeeklyTraffic();

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unable to retrieve analytics data',
                'error' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    //  public function getMonthlyStats(Request $request)
    // {
    //     try {
    //         $stats = $this->analyticsService->getMonthlyTraffic();

    //         return response()->json([
    //             'success' => true,
    //             'data' => $stats
    //         ]);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'Unable to retrieve analytics data',
    //             'error' => config('app.debug') ? $e->getMessage() : null
    //         ], 500);
    //     }
    // }
}