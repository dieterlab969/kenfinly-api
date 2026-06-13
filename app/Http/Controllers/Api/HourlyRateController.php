<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateHourlyRateRequest;
use App\Http\Resources\HourlyRateChangeResource;
use App\Services\HourlyRateService;
use Illuminate\Http\JsonResponse;

class HourlyRateController extends Controller
{
    public function __construct(private readonly HourlyRateService $service)
    {
    }

    public function update(UpdateHourlyRateRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $updatedUser = $this->service->update($user, (int) $request->validated('hourly_rate'));

        return response()->json([
            'success' => true,
            'user' => $updatedUser,
        ]);
    }

    public function history(): JsonResponse
    {
        $user = auth('api')->user();

        return response()->json([
            'success' => true,
            'data' => HourlyRateChangeResource::collection($this->service->history($user)),
        ]);
    }
}
