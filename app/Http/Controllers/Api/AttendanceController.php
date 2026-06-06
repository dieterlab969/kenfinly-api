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
        logger()->info('AttendanceController.status called', ['user_id' => auth('api')->id()]);
        $payload = $this->attendanceService->status(auth('api')->user());
        logger()->info('AttendanceController.status completed', ['user_id' => auth('api')->id(), 'attendance_present' => (bool) $payload['attendance']]);
        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ]);
    }

    public function start(): JsonResponse
    {
        logger()->info('AttendanceController.start called', ['user_id' => auth('api')->id()]);
        try {
            $payload = $this->attendanceService->start(auth('api')->user());
        } catch (QueryException $e) {
            logger()->warning('AttendanceController.start duplicate or query error', ['user_id' => auth('api')->id(), 'exception' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'A Halo session already exists for today.',
            ], 409);
        }

        logger()->info('AttendanceController.start completed', ['user_id' => auth('api')->id(), 'attendance_present' => (bool) $payload['attendance']]);
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

        logger()->info('AttendanceController.complete called', ['user_id' => auth('api')->id(), 'validated' => $validated]);

        $payload = $this->attendanceService->complete(
            auth('api')->user(),
            $validated['user_rating'] ?? null,
            $validated['quote_vote'] ?? null
        );

        logger()->info('AttendanceController.complete completed', ['user_id' => auth('api')->id(), 'attendance_present' => (bool) $payload['attendance']]);

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

        logger()->info('AttendanceController.kill called', ['user_id' => auth('api')->id(), 'validated' => $validated]);

        $payload = $this->attendanceService->kill(
            auth('api')->user(),
            $validated['kill_reason'] ?? null
        );

        logger()->info('AttendanceController.kill completed', ['user_id' => auth('api')->id(), 'attendance_present' => (bool) $payload['attendance']]);

        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ]);
    }
}
