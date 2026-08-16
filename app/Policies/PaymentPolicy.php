<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function view(User $user, Payment $payment): bool
    {
        return (int) $payment->user_id === (int) $user->id || $user->hasRole('super_admin');
    }

    public function retry(User $user, Payment $payment): bool
    {
        return (int) $payment->user_id === (int) $user->id;
    }
}