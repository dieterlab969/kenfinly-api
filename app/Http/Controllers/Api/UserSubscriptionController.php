<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSubscription;
use App\Models\UserSubscriptionReminder;
use App\Models\UserPaymentHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manage a user's own recurring service subscriptions (Netflix, Spotify, etc.).
 *
 * OWNERSHIP MODEL
 * ───────────────
 * Every query scopes to user_id = auth()->id(). Passing a valid ID
 * belonging to another user returns 404 (IDOR prevention).
 */
class UserSubscriptionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    // ── index ─────────────────────────────────────────────────────────────

    /**
     * GET /api/user-subscriptions
     * List all non-deleted subscriptions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $query = UserSubscription::where('user_id', auth('api')->id())
            ->where('is_deleted', false)
            ->with('reminder');

        // Filter by status
        if ($request->has('status') && in_array($request->status, ['ACTIVE', 'EXPIRED'])) {
            $query->where('status', $request->status);
        }

        // Filter by billing cycle
        if ($request->has('billing_cycle') && in_array($request->billing_cycle, ['WEEKLY', 'MONTHLY', 'YEARLY'])) {
            $query->where('billing_cycle', $request->billing_cycle);
        }

        // Search by service name
        if ($request->has('search') && trim($request->search) !== '') {
            $query->where('service_name', 'like', '%' . trim($request->search) . '%');
        }

        // Sort
        $sort = $request->get('sort', 'next_billing_date_asc');
        match ($sort) {
            'next_billing_date_asc'  => $query->orderBy('next_billing_date', 'asc'),
            'next_billing_date_desc' => $query->orderBy('next_billing_date', 'desc'),
            'amount_high'            => $query->orderBy('amount', 'desc'),
            'amount_low'             => $query->orderBy('amount', 'asc'),
            'name_asc'               => $query->orderBy('service_name', 'asc'),
            default                  => $query->orderBy('next_billing_date', 'asc'),
        };

        $subscriptions = $query->get();

        return response()->json([
            'success'       => true,
            'subscriptions' => $subscriptions,
        ]);
    }

    // ── store ─────────────────────────────────────────────────────────────

    /**
     * POST /api/user-subscriptions
     * Create a new subscription for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_name'                    => 'required|string|max:255',
            'amount'                          => 'required|numeric|min:0.01',
            'currency'                        => 'required|string|in:VND,USD',
            'billing_cycle'                   => 'required|in:WEEKLY,MONTHLY,YEARLY',
            'next_billing_date'               => 'required|date',
            'is_trial'                        => 'boolean',
            'reminder'                        => 'nullable|array',
            'reminder.is_enabled'             => 'boolean',
            'reminder.remind_before_days'     => 'integer|in:1,3,5,7,14',
            'reminder.channels'               => 'array',
            'reminder.channels.*'             => 'in:email,push',
        ]);

        $subscription = UserSubscription::create([
            'user_id'           => auth('api')->id(),
            'service_name'      => $validated['service_name'],
            'amount'            => $validated['amount'],
            'currency'          => $validated['currency'],
            'billing_cycle'     => $validated['billing_cycle'],
            'next_billing_date' => $validated['next_billing_date'],
            'is_trial'          => $validated['is_trial'] ?? false,
            'status'            => 'ACTIVE',
        ]);

        // Save reminder if provided
        if (!empty($validated['reminder'])) {
            $r = $validated['reminder'];
            UserSubscriptionReminder::create([
                'user_subscription_id' => $subscription->id,
                'is_enabled'           => $r['is_enabled'] ?? true,
                'remind_before_days'   => $r['remind_before_days'] ?? 3,
                'channels'             => $r['channels'] ?? ['email'],
            ]);
        }

        $subscription->load('reminder');

        return response()->json([
            'success'      => true,
            'message'      => 'Subscription created successfully.',
            'subscription' => $subscription,
        ], 201);
    }

    // ── show ──────────────────────────────────────────────────────────────

    /**
     * GET /api/user-subscriptions/{id}
     * Get a single subscription (must belong to authenticated user).
     */
    public function show(int $id): JsonResponse
    {
        $subscription = UserSubscription::where('user_id', auth('api')->id())
            ->where('id', $id)
            ->with('reminder')
            ->firstOrFail();

        return response()->json([
            'success'      => true,
            'subscription' => $subscription,
        ]);
    }

    // ── update ────────────────────────────────────────────────────────────

    /**
     * PUT /api/user-subscriptions/{id}
     * Update a subscription owned by the authenticated user.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $subscription = UserSubscription::where('user_id', auth('api')->id())
            ->where('id', $id)
            ->where('is_deleted', false)
            ->firstOrFail();

        $validated = $request->validate([
            'service_name'                    => 'required|string|max:255',
            'amount'                          => 'required|numeric|min:0.01',
            'currency'                        => 'required|string|in:VND,USD',
            'billing_cycle'                   => 'required|in:WEEKLY,MONTHLY,YEARLY',
            'next_billing_date'               => 'required|date',
            'is_trial'                        => 'boolean',
            'reminder'                        => 'nullable|array',
            'reminder.is_enabled'             => 'boolean',
            'reminder.remind_before_days'     => 'integer|in:1,3,5,7,14',
            'reminder.channels'               => 'array',
            'reminder.channels.*'             => 'in:email,push',
        ]);

        $subscription->update([
            'service_name'      => $validated['service_name'],
            'amount'            => $validated['amount'],
            'currency'          => $validated['currency'],
            'billing_cycle'     => $validated['billing_cycle'],
            'next_billing_date' => $validated['next_billing_date'],
            'is_trial'          => $validated['is_trial'] ?? $subscription->is_trial,
        ]);

        // Upsert reminder
        if (isset($validated['reminder'])) {
            $r = $validated['reminder'];
            UserSubscriptionReminder::updateOrCreate(
                ['user_subscription_id' => $subscription->id],
                [
                    'is_enabled'         => $r['is_enabled'] ?? true,
                    'remind_before_days' => $r['remind_before_days'] ?? 3,
                    'channels'           => $r['channels'] ?? ['email'],
                ]
            );
        }

        $subscription->load('reminder');

        return response()->json([
            'success'      => true,
            'message'      => 'Subscription updated successfully.',
            'subscription' => $subscription,
        ]);
    }

    // ── destroy ───────────────────────────────────────────────────────────

    /**
     * DELETE /api/user-subscriptions/{id}
     * Soft-delete: sets is_deleted=true, status=EXPIRED.
     * No physical row is removed to preserve payment history.
     */
    public function destroy(int $id): JsonResponse
    {
        $subscription = UserSubscription::where('user_id', auth('api')->id())
            ->where('id', $id)
            ->where('is_deleted', false)
            ->firstOrFail();

        $subscription->update([
            'is_deleted' => true,
            'status'     => 'EXPIRED',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Subscription deleted successfully.',
        ]);
    }

    // ── paymentHistory ────────────────────────────────────────────────────

    /**
     * GET /api/user-subscriptions/{id}/payment-history
     * Return payment history records for a single subscription.
     */
    public function paymentHistory(int $id): JsonResponse
    {
        $subscription = UserSubscription::where('user_id', auth('api')->id())
            ->where('id', $id)
            ->firstOrFail();

        $history = UserPaymentHistory::where('user_subscription_id', $subscription->id)
            ->orderBy('payment_date', 'desc')
            ->get();

        return response()->json([
            'success'      => true,
            'subscription' => $subscription,
            'history'      => $history,
        ]);
    }
}
