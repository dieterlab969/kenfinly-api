<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'service_name',
        'amount',
        'currency',
        'billing_cycle',
        'next_billing_date',
        'is_trial',
        'status',
        'is_deleted',
    ];

    protected $casts = [
        'amount'            => 'decimal:2',
        'next_billing_date' => 'date',
        'is_trial'          => 'boolean',
        'is_deleted'        => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reminder(): HasOne
    {
        return $this->hasOne(UserSubscriptionReminder::class);
    }

    public function paymentHistories(): HasMany
    {
        return $this->hasMany(UserPaymentHistory::class);
    }

    /** Scope: only non-deleted records. */
    public function scopeActive($query)
    {
        return $query->where('is_deleted', false)->where('status', 'ACTIVE');
    }

    /** Scope: expired but not deleted. */
    public function scopeExpired($query)
    {
        return $query->where('is_deleted', false)->where('status', 'EXPIRED');
    }
}
