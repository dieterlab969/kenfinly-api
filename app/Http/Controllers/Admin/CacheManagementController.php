<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class CacheManagementController extends Controller
{
    public function clearApplicationCache()
    {
        try {
            Cache::flush();
            return response()->json([
                'success' => true,
                'message' => 'Application cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear application cache: ' . $e->getMessage()
            ], 500);
        }
    }

    public function clearConfigCache()
    {
        try {
            Artisan::call('config:clear');
            return response()->json([
                'success' => true,
                'message' => 'Config cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear config cache: ' . $e->getMessage()
            ], 500);
        }
    }

    public function clearRouteCache()
    {
        try {
            Artisan::call('route:clear');
            return response()->json([
                'success' => true,
                'message' => 'Route cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear route cache: ' . $e->getMessage()
            ], 500);
        }
    }

    public function clearViewCache()
    {
        try {
            Artisan::call('view:clear');
            return response()->json([
                'success' => true,
                'message' => 'View cache cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear view cache: ' . $e->getMessage()
            ], 500);
        }
    }

    public function clearAllCaches()
    {
        try {
            Cache::flush();
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');
            
            return response()->json([
                'success' => true,
                'message' => 'All caches cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear caches: ' . $e->getMessage()
            ], 500);
        }
    }
}
