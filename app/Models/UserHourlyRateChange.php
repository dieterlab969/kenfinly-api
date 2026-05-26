<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserHourlyRateChange extends Model
{
    protected $fillable = [
        'user_id',
        'old_hourly_rate',
        'new_hourly_rate',
        'changed_at',
        'next_allowed_at',
    ];

    protected $casts = [
        'old_hourly_rate' => 'integer',
        'new_hourly_rate' => 'integer',
        'changed_at' => 'datetime',
        'next_allowed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
