<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommitmentRequest;
use App\Http\Resources\CommitmentResource;
use App\Models\Commitment;
use App\Services\CommitmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommitmentController extends Controller
{
    public function __construct(private readonly CommitmentService $service)
    {
    }

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
        $this->authorizeOwner($commitment);

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
            $request->only(['title', 'goal_amount', 'deadline']),
            $request->file('image')
        );

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ], 201);
    }

    public function complete(Commitment $commitment): JsonResponse
    {
        $this->authorizeOwner($commitment);
        $user = auth('api')->user();

        $commitment = $this->service->complete($user, $commitment);

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ]);
    }

    public function kill(Request $request, Commitment $commitment): JsonResponse
    {
        $this->authorizeOwner($commitment);
        $validated = $request->validate([
            'kill_reason' => 'nullable|string|max:255',
        ]);

        $user = auth('api')->user();
        $commitment = $this->service->kill($user, $commitment, $validated['kill_reason'] ?? null);

        return response()->json([
            'success' => true,
            'data' => new CommitmentResource($commitment),
        ]);
    }

    private function authorizeOwner(Commitment $commitment): void
    {
        $userId = (int) auth('api')->id();
        abort_if((int) $commitment->user_id !== $userId, 403, 'Forbidden');
    }
}
