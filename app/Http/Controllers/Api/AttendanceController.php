<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HaloSessionResource;
use App\Services\AttendanceService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendanceService)
    {
    }

    public function status(): JsonResponse
    {
        $payload = $this->attendanceService->status(auth('api')->user());
        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ]);
    }

    public function start(): JsonResponse
    {
        try {
            $payload = $this->attendanceService->start(auth('api')->user());
        } catch (QueryException $e) {
            // Standard 6 — should not escape the service, but guard at the HTTP layer too.
            return response()->json([
                'success' => false,
                'message' => 'A Halo session already exists for today.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ], 201);
    }

    public function complete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_rating' => 'nullable|in:excellent,normal,laggy',
            'quote_vote' => 'nullable|in:agree,disagree',
        ]);

        $payload = $this->attendanceService->complete(
            auth('api')->user(),
            $validated['user_rating'] ?? null,
            $validated['quote_vote'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ]);
    }

    public function kill(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'kill_reason' => 'nullable|string|max:255',
        ]);

        $payload = $this->attendanceService->kill(
            auth('api')->user(),
            $validated['kill_reason'] ?? null
        );

        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ]);
    }
}
