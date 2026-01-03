<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
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

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * The attributes that should be hidden for arrays and JSON serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'provider_id',
    ];

    /**
     * Defines the relationship to the user who owns this payment method.
     *
     * Use this relationship to access the user associated with this payment method.
     *
     * @return BelongsTo Returns the belongs-to relationship to the User model.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Gets a user-friendly display name for the payment method.
     *
     * This accessor returns a formatted string describing the payment method,
     * such as "Visa ending in 1234" for credit cards or "PayPal (email@example.com)".
     * For other types, it returns a capitalized type name.
     *
     * Use this attribute when showing payment method details in UI components.
     *
     * @return string The formatted display name of the payment method.
     */
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

    /**
     * Determines if the payment method is expired.
     *
     * This method checks the expiry month and year against the current date.
     * If either expiry month or year is missing, it assumes the payment method is not expired.
     *
     * Use this method to prevent using expired payment methods for transactions.
     *
     * @return bool Returns true if the payment method is expired; false otherwise.
     */
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
