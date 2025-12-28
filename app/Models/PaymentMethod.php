<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'provider',
        'last_four',
        'brand',
        'expiry_month',
        'expiry_year',
        'holder_name',
        'email',
        'provider_id',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    protected $hidden = [
        'provider_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->type === 'credit_card') {
            $brand = ucfirst($this->brand ?? 'Card');
            return "{$brand} ending in {$this->last_four}";
        }
        
        if ($this->type === 'paypal') {
            return "PayPal ({$this->email})";
        }
        
        return ucfirst($this->type);
    }

    public function isExpired(): bool
    {
        if (!$this->expiry_month || !$this->expiry_year) {
            return false;
        }
        
        $expiryDate = \Carbon\Carbon::createFromDate(
            $this->expiry_year,
            $this->expiry_month,
            1
        )->endOfMonth();
        
        return $expiryDate->isPast();
    }
}
