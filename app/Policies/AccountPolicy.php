<?php

namespace App\Policies;

use App\Models\Account;
use App\Models\User;

class AccountPolicy
{
    public function view(User $user, Account $account): bool
    {
        return $account->user_id === $user->id || 
               $account->hasParticipant($user->id);
    }

    public function update(User $user, Account $account): bool
    {
        if ($account->user_id === $user->id) {
            return true;
        }
        
        $role = $account->getParticipantRole($user->id);
        return in_array($role, ['owner', 'editor']);
    }

    public function delete(User $user, Account $account): bool
    {
        return $account->user_id === $user->id;
    }

    public function manageParticipants(User $user, Account $account): bool
    {
        if ($account->user_id === $user->id) {
            return true;
        }
        
        return $account->getParticipantRole($user->id) === 'owner';
    }
}
