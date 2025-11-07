<?php

namespace App\Observers;

use App\Models\Account;
use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     * Automatically create a default wallet for the new user.
     */
    public function created(User $user): void
    {
        Account::create([
            'user_id' => $user->id,
            'name' => 'My Wallet',
            'balance' => 0.00,
            'currency' => 'USD',
            'icon' => '💰',
            'color' => '#3b82f6',
        ]);
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        //
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event.
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "force deleted" event.
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
