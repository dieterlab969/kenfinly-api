<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;

/**
 * Public subscription plan catalogue.
 *
 * @tags Subscriptions
 */
class SubscriptionPlanController extends Controller
{
    /**
     * Retrieve all active subscription plans ordered by sort order.
     *
     * @return JsonResponse JSON response containing a collection of active subscription plans.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            SubscriptionPlan::where('is_active', true)
                ->orderBy('sort_order')
                ->get()
        );
    }
}
