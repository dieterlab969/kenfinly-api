<?php

namespace App\Observers;

use App\Models\Account;
use App\Models\User;
use App\Services\HaloPointLedgerService;
use Illuminate\Support\Facades\DB;

/**
 * Listens to Eloquent lifecycle events on the User model.
 *
 * Registered in AppServiceProvider (or via the #[ObservedBy] attribute on
 * the User model). Currently handles the "created" event to bootstrap every
 * new user account with sensible defaults in a single atomic transaction:
 *
 *  1. A default "My Wallet" account (USD, balance 0).
 *  2. A Halo Point Ledger genesis block (immutable audit chain starting point).
 *  3. A 7-day free trial subscription.
 */
class UserObserver
{
    /**
     * Handle the User "created" event.
     *
     * Runs inside a database transaction to ensure that a partial failure
     * (e.g. ledger genesis creation throws) does not leave the user without
     * a wallet or vice versa. Uses `updateQuietly` for the trial grant to
     * avoid re-triggering this observer.
     *
     * @param  User  $user  The newly persisted user instance.
     * @return void
     */
    public function created(User $user): void
    {
        DB::transaction(function () use ($user) {
            Account::firstOrCreate(
                ['user_id' => $user->id, 'name' => 'My Wallet'],
                [
                    'balance'  => 0.00,
                    'currency' => 'USD',
                    'icon'     => '💰',
                    'color'    => '#3b82f6',
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
     *
     * Reserved for future logic (e.g. invalidating caches on profile changes).
     *
     * @param  User  $user  The user instance after the update.
     * @return void
     */
    public function updated(User $user): void
    {
        //
    }

    /**
     * Handle the User "deleted" event.
     *
     * Reserved for future cleanup logic (e.g. anonymising related records).
     *
     * @param  User  $user  The user instance that was soft- or hard-deleted.
     * @return void
     */
    public function deleted(User $user): void
    {
        //
    }

    /**
     * Handle the User "restored" event (soft-delete restore).
     *
     * Reserved for future reactivation logic.
     *
     * @param  User  $user  The user instance that was restored.
     * @return void
     */
    public function restored(User $user): void
    {
        //
    }

    /**
     * Handle the User "forceDeleted" event (permanent hard delete).
     *
     * Reserved for future permanent-deletion cleanup (e.g. GDPR erasure).
     *
     * @param  User  $user  The user instance that was permanently deleted.
     * @return void
     */
    public function forceDeleted(User $user): void
    {
        //
    }
}
