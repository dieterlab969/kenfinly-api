<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SubscriptionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

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
