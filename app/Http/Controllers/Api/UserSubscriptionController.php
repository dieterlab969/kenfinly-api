<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserSubscriptionRequest;
use App\Http\Requests\UpdateUserSubscriptionRequest;
use App\Http\Requests\UserSubscriptionIndexRequest;
use App\Services\UserSubscriptionService;
use Illuminate\Http\JsonResponse;

class UserSubscriptionController extends Controller
{
    public function __construct(private readonly UserSubscriptionService $subscriptions)
    {
        $this->middleware('auth:api');
    }

    public function index(UserSubscriptionIndexRequest $request): JsonResponse
    {
        $items = $this->subscriptions->listFor(auth('api')->user(), $request->validated());
        return response()->json([
            'success' => true,
            'data' => $items,
            'subscriptions' => $items,
        ]);
    }

    public function store(StoreUserSubscriptionRequest $request): JsonResponse
    {
        $subscription = $this->subscriptions->create(auth('api')->user(), $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Subscription created successfully.',
            'data' => $subscription,
            'subscription' => $subscription,
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $subscription = $this->owned($id);
        return response()->json([
            'success' => true,
            'data' => $subscription,
            'subscription' => $subscription,
        ]);
    }

    public function update(UpdateUserSubscriptionRequest $request, int $id): JsonResponse
    {
        $subscription = $this->owned($id, true);
        $subscription = $this->subscriptions->update($subscription, $request->validated());
        return response()->json([
            'success' => true,
            'message' => 'Subscription updated successfully.',
            'data' => $subscription,
            'subscription' => $subscription,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $subscription = $this->owned($id, true);
        $this->subscriptions->delete($subscription);
        return response()->json([
            'success' => true,
            'message' => 'Subscription deleted successfully.',
            'data' => [],
        ]);
    }

    public function paymentHistory(int $id): JsonResponse
    {
        $subscription = $this->owned($id);
        $history = $this->subscriptions->paymentHistory($subscription);
        return response()->json([
            'success' => true,
            'data' => ['subscription' => $subscription, 'history' => $history],
            'subscription' => $subscription,
            'history' => $history,
        ]);
    }

    private function owned(int $id, bool $activeOnly = false)
    {
        $query = \App\Models\UserSubscription::where('user_id', auth('api')->id())
            ->where('id', $id)
            ->with('reminder');
        if ($activeOnly) {
            $query->where('is_deleted', false);
        }
        return $query->firstOrFail();
    }
}