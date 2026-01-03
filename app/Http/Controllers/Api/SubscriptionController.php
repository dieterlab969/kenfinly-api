<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controller for managing user subscriptions.
 *
 * Handles creation and updating of subscriptions for authenticated users.
 */
class SubscriptionController extends Controller
{
    /**
     * SubscriptionController constructor.
     * Applies authentication middleware to all endpoints.
     */
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Create or update a subscription for the authenticated user.
     *
     * Validates the requested subscription plan and either updates an existing
     * subscription or creates a new one with status 'pending'.
     *
     * @param Request $request Incoming HTTP request containing 'plan_id'.
     * @return JsonResponse JSON response with the subscription data and HTTP 201 status.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $plan = SubscriptionPlan::findOrFail($validated['plan_id']);

        $subscription = Subscription::updateOrCreate(
            ['user_id' => auth()->id(), 'plan_id' => $plan->id],
            [
                'status' => 'pending',
                'amount' => $plan->price,
                'currency' => $plan->currency,
                'start_date' => now(),
            ]
        );

        return response()->json($subscription, 201);
    }
}
