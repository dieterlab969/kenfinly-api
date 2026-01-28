<?php

namespace App\Http\Controllers\Api\SavingTracker;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AchievementController extends Controller
{
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
