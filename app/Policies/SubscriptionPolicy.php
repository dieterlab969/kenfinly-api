<?php

namespace App\Policies;

use App\Models\Subscription;
use App\Models\User;

class SubscriptionPolicy
{
    public function view(User $user, Subscription $subscription): bool
    {
        return (int) $subscription->user_id === (int) $user->id || $user->hasRole('super_admin');
    }
}