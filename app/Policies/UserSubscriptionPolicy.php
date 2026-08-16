<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UserSubscription;

class UserSubscriptionPolicy
{
    public function view(User $user, UserSubscription $subscription): bool
    {
        return (int) $subscription->user_id === (int) $user->id;
    }

    public function update(User $user, UserSubscription $subscription): bool
    {
        return $this->view($user, $subscription);
    }

    public function delete(User $user, UserSubscription $subscription): bool
    {
        return $this->view($user, $subscription);
    }
}