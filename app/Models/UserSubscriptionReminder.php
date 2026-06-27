<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserSubscriptionReminder extends Model
{
    protected $fillable = [
        'user_subscription_id',
        'remind_before_days',
        'channels',
        'is_enabled',
        'last_reminded_at',
    ];

    protected $casts = [
        'channels'         => 'array',
        'is_enabled'       => 'boolean',
        'last_reminded_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(UserSubscription::class, 'user_subscription_id');
    }
}
