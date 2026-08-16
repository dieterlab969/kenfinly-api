<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\KillCommitmentRequest;
use App\Http\Requests\StoreCommitmentRequest;
use App\Http\Resources\CommitmentResource;
use App\Models\Commitment;
use App\Services\CommitmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manage Halo Commitments — time-boxed financial goals tracked by the Halo engine.
 *
 * @tags Halo — Commitments
 */
class CommitmentController extends Controller
{
    public function __construct(private readonly CommitmentService $service)
    {
    }

    /**
     * List commitments for the authenticated user.
     *
     * @queryParam status string Filter by status (active|completed|failed). Example: active
     * @queryParam per_page int Results per page (1–100, default 20). Example: 20
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $query = Commitment::where('user_id', $user->id);

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $perPage = (int) $request->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));

        $page = $query->orderBy('status')
            ->orderBy('deadline')
            ->cursorPaginate($perPage);

        return response()->json([
            'success' => true,
            'data' => CommitmentResource::collection($page),
            'next_cursor' => $page->nextCursor()?->encode(),
            'prev_cursor' => $page->previousCursor()?->encode(),
        ]);
    }

    public function show(Commitment $commitment): JsonResponse
    {
        $this->authorize('view', $commitment);

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ]);
    }

    public function store(StoreCommitmentRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        $commitment = $this->service->create(
            $user,
            $request->validated(),
            $request->file('image')
        );

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ], 201);
    }

    public function complete(Commitment $commitment): JsonResponse
    {
        $this->authorize('complete', $commitment);
        $user = auth('api')->user();

        $commitment = $this->service->complete($user, $commitment);

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ]);
    }

    public function kill(KillCommitmentRequest $request, Commitment $commitment): JsonResponse
    {
        $this->authorize('kill', $commitment);

        $user = auth('api')->user();
        $commitment = $this->service->kill($user, $commitment, $request->validated('kill_reason'));

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ]);
    }

}
