<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PomodoroSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PomodoroController extends Controller
{
    public function __construct(private readonly PomodoroSyncService $service)
    {
    }

    public function start(Request $request): JsonResponse
    {
        return response()->json($this->service->start(
            $request->user(),
            (array) $request->attributes->get('pomodoro_acl', []),
        ), 201);
    }

    public function state(Request $request): JsonResponse
    {
        return response()->json($this->service->state(
            $request->user(),
            (array) $request->attributes->get('pomodoro_acl', []),
        ));
    }

    public function complete(Request $request): JsonResponse
    {
        return response()->json($this->service->complete(
            $request->user(),
            (array) $request->attributes->get('pomodoro_acl', []),
        ));
    }
}
