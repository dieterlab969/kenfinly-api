<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\HaloSessionResource;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;

/**
 * Standard 9 — Persistent Halo Countdown State.
 *
 * GET /api/halo/current-session always returns accurate remaining time using
 * `expected_end_at` from the database; frontend timers are presentation-only.
 * Frontend state may reset on refresh/restart/device switch; the backend is authoritative.
 */
class HaloSessionController extends Controller
{
    public function __construct(private readonly AttendanceService $attendanceService)
    {
    }

    public function current(): JsonResponse
    {
        $payload = $this->attendanceService->status(auth('api')->user());

        return response()->json([
            'success' => true,
            'data' => new HaloSessionResource($payload),
        ]);
    }
}
