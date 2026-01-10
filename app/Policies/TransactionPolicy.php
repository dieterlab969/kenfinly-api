<?php

namespace App\Policies;

use App\Models\Transaction;
use App\Models\User;

class TransactionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Transaction $transaction): bool
    {
        return $transaction->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['owner', 'editor']);
    }

    public function update(User $user, Transaction $transaction): bool
    {
        if ($transaction->user_id !== $user->id) {
            return false;
        }

        return $user->hasAnyRole(['owner', 'editor']);
    }

    public function delete(User $user, Transaction $transaction): bool
    {
        if ($transaction->user_id !== $user->id) {
            return false;
        }

        return $user->hasAnyRole(['owner', 'editor']);
    }

    public function managePhotos(User $user, Transaction $transaction): bool
    {
        if ($transaction->user_id !== $user->id) {
            return false;
        }

        return $user->hasAnyRole(['owner', 'editor']);
    }
}
