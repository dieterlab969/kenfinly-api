<?php

namespace App\Http\Controllers\Api\SavingTracker;

use App\Http\Controllers\Controller;
use App\Models\Habit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class HabitController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $habits = Habit::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->with(['trackings' => function ($query) {
                $query->where('date', '>=', now()->subDays(30));
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $habits,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'frequency' => 'required|integer|min:1|max:7',
            'color' => 'nullable|string|max:7',
        ]);

        $habit = Habit::create([
            'user_id' => $request->user()->id,
            'name' => $validated['name'],
            'amount' => $validated['amount'],
            'frequency' => $validated['frequency'],
            'color' => $validated['color'] ?? '#3B82F6',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Habit created successfully',
            'data' => $habit,
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $habit = Habit::where('user_id', $request->user()->id)
            ->with(['trackings', 'achievements'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $habit,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $habit = Habit::where('user_id', $request->user()->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0',
            'frequency' => 'sometimes|integer|min:1|max:7',
            'color' => 'sometimes|string|max:7',
            'is_active' => 'sometimes|boolean',
        ]);

        $habit->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Habit updated successfully',
            'data' => $habit->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $habit = Habit::where('user_id', $request->user()->id)->findOrFail($id);
        $habit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Habit deleted successfully',
        ]);
    }

    public function stats(Request $request, int $id): JsonResponse
    {
        $habit = Habit::where('user_id', $request->user()->id)
            ->with('trackings')
            ->findOrFail($id);

        $completedCount = $habit->trackings->where('completed', true)->count();
        $totalSaved = $completedCount * floatval($habit->amount);

        $thisWeek = $habit->trackings
            ->where('date', '>=', now()->startOfWeek())
            ->where('completed', true)
            ->count();

        $thisMonth = $habit->trackings
            ->where('date', '>=', now()->startOfMonth())
            ->where('completed', true)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'habit_id' => $habit->id,
                'current_streak' => $habit->current_streak,
                'total_saved' => $totalSaved,
                'completed_count' => $completedCount,
                'this_week' => $thisWeek,
                'this_month' => $thisMonth,
            ],
        ]);
    }

    public function overallStats(Request $request): JsonResponse
    {
        $habits = Habit::where('user_id', $request->user()->id)
            ->where('is_active', true)
            ->with('trackings')
            ->get();

        $totalSaved = $habits->sum('total_saved');
        $totalHabits = $habits->count();
        $longestStreak = $habits->max('current_streak') ?? 0;

        $thisWeekCompleted = 0;
        $thisMonthCompleted = 0;

        foreach ($habits as $habit) {
            $thisWeekCompleted += $habit->trackings
                ->where('date', '>=', now()->startOfWeek())
                ->where('completed', true)
                ->count();

            $thisMonthCompleted += $habit->trackings
                ->where('date', '>=', now()->startOfMonth())
                ->where('completed', true)
                ->count();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_saved' => $totalSaved,
                'total_habits' => $totalHabits,
                'longest_streak' => $longestStreak,
                'this_week_completed' => $thisWeekCompleted,
                'this_month_completed' => $thisMonthCompleted,
            ],
        ]);
    }
}
