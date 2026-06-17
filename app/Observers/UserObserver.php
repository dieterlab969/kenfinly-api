<?php

namespace App\Observers;

use App\Models\Account;
use App\Models\User;
use App\Services\HaloPointLedgerService;
use Illuminate\Support\Facades\DB;

class UserObserver
{
    /**
     * Handle the User "created" event.
     * Automatically create a default wallet for the new user.
     */
    public function created(User $user): void
    {
        DB::transaction(function () use ($user) {
            Account::firstOrCreate(
                ['user_id' => $user->id, 'name' => 'My Wallet'],
                [
                    'balance' => 0.00,
                    'currency' => 'USD',
                    'icon' => '💰',
                    'color' => '#3b82f6',
                ]
            );

            app(HaloPointLedgerService::class)->createGenesisBlock($user);

            // Grant a 7-day free trial on first registration.
            $user->updateQuietly([
                'subscription_status' => 'trial',
                'subscription_plan'   => 'free',
                'trial_ends_at'       => now()->addDays(7),
            ]);
        });
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
