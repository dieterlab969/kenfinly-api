<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Http\Resources\AccountResource;
use App\Services\AccountService;
use Illuminate\Http\JsonResponse;

class AccountController extends Controller
{
    public function __construct(private readonly AccountService $accounts)
    {
    }

    public function index(): JsonResponse
    {
        $accounts = $this->accounts->listFor(auth('api')->user());
        return response()->json([
            'success' => true,
            'data' => AccountResource::collection($accounts),
            'accounts' => AccountResource::collection($accounts),
        ]);
    }

    public function store(StoreAccountRequest $request): JsonResponse
    {
        $account = $this->accounts->create(auth('api')->user(), $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'data' => new AccountResource($account),
            'account' => new AccountResource($account),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $account = $this->accounts->findOwned(auth('api')->user(), $id, true);
        return response()->json([
            'success' => true,
            'data' => new AccountResource($account),
            'account' => new AccountResource($account),
        ]);
    }

    public function update(UpdateAccountRequest $request, int $id): JsonResponse
    {
        $account = $this->accounts->findOwned(auth('api')->user(), $id);
        $account = $this->accounts->update($account, $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'data' => new AccountResource($account),
            'account' => new AccountResource($account),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $account = $this->accounts->findOwned(auth('api')->user(), $id);
        try {
            $this->accounts->delete($account);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => []], 400);
        }
        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully',
            'data' => [],
        ]);
    }
}