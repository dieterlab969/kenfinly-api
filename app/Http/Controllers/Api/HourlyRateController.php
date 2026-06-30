<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateHourlyRateRequest;
use App\Http\Resources\HourlyRateChangeResource;
use App\Services\HourlyRateService;
use Illuminate\Http\JsonResponse;

/**
 * User hourly rate management (Halo engine valuation).
 *
 * Updates are subject to semi-annual review-window enforcement.
 *
 * @tags Halo — Hourly Rate
 */
class HourlyRateController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @param HourlyRateService $service Service responsible for governance enforcement.
     */
    public function __construct(private readonly HourlyRateService $service)
    {
    }

    /**
     * Update the authenticated user's hourly rate.
     *
     * @param UpdateHourlyRateRequest $request Validated hourly rate update request.
     *
     * @return JsonResponse JSON response containing the refreshed user payload.
     */
    public function update(UpdateHourlyRateRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $updatedUser = $this->service->update($user, (int) $request->validated('hourly_rate'));

        return response()->json([
            'success' => true,
            'user' => $updatedUser,
        ]);
    }

    /**
     * Return hourly rate change history for the authenticated user.
     *
     * @return JsonResponse JSON response containing normalized change-log entries.
     */
    public function history(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'success' => true,
            'data' => HourlyRateChangeResource::collection($this->service->history($user)),
        ]);
    }
}
