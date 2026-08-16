<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPaymentHistory;
use App\Models\UserSubscription;
use App\Models\UserSubscriptionReminder;
use Illuminate\Support\Facades\DB;

class UserSubscriptionService
{
    public function listFor(User $user, array $filters)
    {
        $query = UserSubscription::where('user_id', $user->id)
            ->where('is_deleted', false)
            ->with('reminder');

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (isset($filters['billing_cycle'])) {
            $query->where('billing_cycle', $filters['billing_cycle']);
        }
        if (!empty($filters['search'])) {
            $query->where('service_name', 'like', '%' . trim($filters['search']) . '%');
        }

        match ($filters['sort'] ?? 'next_billing_date_asc') {
            'next_billing_date_desc' => $query->orderByDesc('next_billing_date'),
            'amount_high' => $query->orderByDesc('amount'),
            'amount_low' => $query->orderBy('amount'),
            'name_asc' => $query->orderBy('service_name'),
            default => $query->orderBy('next_billing_date'),
        };

        return $query->get();
    }

    public function create(User $user, array $payload): UserSubscription
    {
        return DB::transaction(function () use ($user, $payload): UserSubscription {
            $subscription = UserSubscription::create([
                'user_id' => $user->id,
                'service_name' => $payload['service_name'],
                'amount' => $payload['amount'],
                'currency' => $payload['currency'],
                'billing_cycle' => $payload['billing_cycle'],
                'next_billing_date' => $payload['next_billing_date'],
                'is_trial' => $payload['is_trial'] ?? false,
                'status' => 'ACTIVE',
            ]);
            $this->saveReminder($subscription, $payload['reminder'] ?? null);
            return $subscription->load('reminder');
        });
    }

    public function update(UserSubscription $subscription, array $payload): UserSubscription
    {
        return DB::transaction(function () use ($subscription, $payload): UserSubscription {
            $subscription->update(array_intersect_key($payload, array_flip([
                'service_name', 'amount', 'currency', 'billing_cycle',
                'next_billing_date', 'is_trial',
            ])));
            if (array_key_exists('reminder', $payload)) {
                $subscription->reminder()->delete();
                $this->saveReminder($subscription, $payload['reminder']);
            }
            return $subscription->fresh('reminder');
        });
    }

    public function delete(UserSubscription $subscription): void
    {
        $subscription->update(['is_deleted' => true, 'status' => 'EXPIRED']);
    }

    public function paymentHistory(UserSubscription $subscription)
    {
        return UserPaymentHistory::where('user_subscription_id', $subscription->id)
            ->orderByDesc('payment_date')
            ->get();
    }

    private function saveReminder(UserSubscription $subscription, ?array $reminder): void
    {
        if (!$reminder) {
            return;
        }
        UserSubscriptionReminder::create([
            'user_subscription_id' => $subscription->id,
            'is_enabled' => $reminder['is_enabled'] ?? true,
            'remind_before_days' => $reminder['remind_before_days'] ?? 3,
            'channels' => $reminder['channels'] ?? ['email'],
        ]);
    }
}