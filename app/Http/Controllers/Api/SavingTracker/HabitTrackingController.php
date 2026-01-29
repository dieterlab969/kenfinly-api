<?php

namespace App\Http\Controllers\Api\SavingTracker;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use App\Models\HabitTracking;
use App\Services\SavingTracker\AchievementService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controller for managing habit tracking completions.
 */
class HabitTrackingController extends Controller
{
    protected AchievementService $achievementService;

    public function __construct(AchievementService $achievementService)
    {
        $this->achievementService = $achievementService;
    }

    /**
     * Toggle the completion status of a habit for a specific date.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'habit_id' => 'required|integer|exists:habits,id',
            'date' => 'required|date',
        ]);

        $habit = Habit::where('user_id', $request->user()->id)
            ->findOrFail($validated['habit_id']);

        $tracking = HabitTracking::where('habit_id', $habit->id)
            ->where('date', $validated['date'])
            ->first();

        if ($tracking) {
            $tracking->completed = !$tracking->completed;
            $tracking->save();
        } else {
            $tracking = HabitTracking::create([
                'habit_id' => $habit->id,
                'date' => $validated['date'],
                'completed' => true,
            ]);
        }

        if ($tracking->completed) {
            $this->achievementService->checkAndAwardAchievements($habit, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => $tracking->completed ? 'Habit marked as completed' : 'Habit marked as incomplete',
            'data' => [
                'tracking' => $tracking,
                'current_streak' => $habit->fresh()->current_streak,
                'total_saved' => $habit->fresh()->total_saved,
            ],
        ]);
    }

    /**
     * Get tracking data for a specific habit within a date range.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $habitId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTracking(Request $request, int $habitId): JsonResponse
    {
        $habit = Habit::where('user_id', $request->user()->id)->findOrFail($habitId);

        $startDate = $request->query('start_date', now()->subDays(30)->format('Y-m-d'));
        $endDate = $request->query('end_date', now()->format('Y-m-d'));

        $trackings = HabitTracking::where('habit_id', $habit->id)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $trackings,
        ]);
    }

    /**
     * Bulk update tracking status for multiple dates.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkTrack(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'habit_id' => 'required|integer|exists:habits,id',
            'dates' => 'required|array',
            'dates.*' => 'required|date',
            'completed' => 'required|boolean',
        ]);

        $habit = Habit::where('user_id', $request->user()->id)
            ->findOrFail($validated['habit_id']);

        $trackings = [];
        foreach ($validated['dates'] as $date) {
            $tracking = HabitTracking::updateOrCreate(
                ['habit_id' => $habit->id, 'date' => $date],
                ['completed' => $validated['completed']]
            );
            $trackings[] = $tracking;
        }

        if ($validated['completed']) {
            $this->achievementService->checkAndAwardAchievements($habit, $request->user());
        }

        return response()->json([
            'success' => true,
            'message' => 'Tracking updated for ' . count($trackings) . ' dates',
            'data' => $trackings,
        ]);
    }
}
