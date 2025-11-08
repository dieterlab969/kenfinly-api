<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_name',
        'amount',
        'currency',
        'status',
        'start_date',
        'end_date',
        'canceled_at',
        'promo_code',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'canceled_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function licenses(): HasMany
    {
        return $this->hasMany(License::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && 
               $this->end_date && 
               $this->end_date->isFuture();
    }
}
