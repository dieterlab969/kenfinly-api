<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPaymentHistory extends Model
{
    protected $fillable = [
        'user_subscription_id',
        'user_id',
        'amount_paid',
        'currency',
        'payment_date',
        'status',
        'failure_reason',
        'transaction_code',
    ];

    protected $casts = [
        'amount_paid'  => 'decimal:2',
        'payment_date' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(UserSubscription::class, 'user_subscription_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
