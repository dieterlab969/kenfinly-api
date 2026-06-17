<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'order_code',
        'plan',
        'total_amount',
        'coupon_applied',
        'discount_amount',
        'status',
        'checkout_url',
        'qr_code',
        'expires_at',
    ];

    protected $casts = [
        'order_code'      => 'integer',
        'total_amount'    => 'integer',
        'discount_amount' => 'integer',
        'expires_at'      => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }

        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    public function remainingSeconds(): int
    {
        if ($this->isExpired() || ! $this->expires_at) {
            return 0;
        }

        return max(0, (int) now()->diffInSeconds($this->expires_at, false));
    }
}
