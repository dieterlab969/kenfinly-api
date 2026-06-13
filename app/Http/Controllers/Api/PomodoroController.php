<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PomodoroSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Handle Pomodoro timer lifecycle endpoints for guest and registered users.
 *
 * This controller delegates all timer state decisions to the Pomodoro sync service
 * and returns JSON payloads that the frontend can use to start, restore, or
 * finalize a Pomodoro session across devices.
 */
class PomodoroController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @param PomodoroSyncService $service Service responsible for Pomodoro state transitions.
     */
    public function __construct(private readonly PomodoroSyncService $service)
    {
    }

    /**
     * Start a new Pomodoro session or return guest-local timer instructions.
     *
     * The ACL middleware attaches the resolved guest or registered-user ability set
     * to the request so the service can decide whether to persist state.
     *
     * @param Request $request Incoming HTTP request with optional authenticated user context.
     *
     * @return JsonResponse JSON response containing the initial timer state payload.
     */
    public function start(Request $request): JsonResponse
    {
        return response()->json($this->service->start(
            $request->user(),
            (array) $request->attributes->get('pomodoro_acl', []),
        ), 201);
    }

    /**
     * Return the current Pomodoro state for the active actor.
     *
     * Registered users receive a server-calculated state derived from persisted
     * timestamps, while guests receive a local-storage-only response.
     *
     * @param Request $request Incoming HTTP request with resolved Pomodoro ACL metadata.
     *
     * @return JsonResponse JSON response describing whether the timer is idle, running, or paused.
     */
    public function state(Request $request): JsonResponse
    {
        return response()->json($this->service->state(
            $request->user(),
            (array) $request->attributes->get('pomodoro_acl', []),
        ));
    }

    /**
     * Complete the active Pomodoro session when its duration has elapsed.
     *
     * This endpoint finalizes the current active state for registered users and
     * converts it into a historical session record when completion is valid.
     *
     * @param Request $request Incoming HTTP request with resolved Pomodoro ACL metadata.
     *
     * @return JsonResponse JSON response describing the completion result.
     */
    public function complete(Request $request): JsonResponse
    {
        return response()->json($this->service->complete(
            $request->user(),
            (array) $request->attributes->get('pomodoro_acl', []),
        ));
    }
}
