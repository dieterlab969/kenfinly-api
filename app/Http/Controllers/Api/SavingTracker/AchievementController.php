<?php

namespace App\Http\Controllers\Api\SavingTracker;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controller for managing user achievements in the Saving Habit Tracker.
 */
class AchievementController extends Controller
{
    /**
     * Display a listing of all achievements for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $achievements = Achievement::where('user_id', $request->user()->id)
            ->with('habit:id,name,color')
            ->orderBy('achieved_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $achievements,
        ]);
    }

    /**
     * Display a listing of unlocked achievements for the authenticated user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function unlocked(Request $request): JsonResponse
    {
        $achievements = Achievement::where('user_id', $request->user()->id)
            ->whereNotNull('achieved_at')
            ->with('habit:id,name,color')
            ->orderBy('achieved_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $achievements,
        ]);
    }
}
