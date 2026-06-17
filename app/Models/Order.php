<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a cart-based subscription checkout order.
 *
 * An Order is created by CheckoutController when a logged-in user submits
 * the cart form. It holds the PayOS order code, the chosen plan, final
 * amounts after any coupon discount, and the PayOS QR / checkout URL.
 *
 * Lifecycle statuses:
 *  - pending  → created, awaiting PayOS payment confirmation
 *  - paid     → PayOS webhook confirmed successful payment
 *  - expired  → TTL of 5 minutes elapsed without payment (set by
 *               ExpireOldOrders command or lazily on read)
 *
 * @property int         $id
 * @property int         $user_id
 * @property int         $order_code       Numeric code shared with PayOS
 * @property string      $plan             "monthly" or "yearly"
 * @property int         $total_amount     Final charged amount in VND
 * @property string|null $coupon_applied   Coupon code used, if any
 * @property int         $discount_amount  Discount in VND (0 when no coupon)
 * @property string      $status           "pending" | "paid" | "expired"
 * @property string|null $checkout_url     PayOS hosted checkout URL
 * @property string|null $qr_code          PayOS QR code string
 * @property \Carbon\Carbon $expires_at    Timestamp after which the order expires
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Order extends Model
{
    /** @var list<string> Mass-assignable attributes. */
    protected $fillable = [
        'user_id',
        'order_code',
        'plan',
        'total_amount',
        'coupon_applied',
        'discount_amount',
        'status',
        'gateway',
        'payment_reference',
        'checkout_url',
        'qr_code',
        'expires_at',
    ];

    /** @var array<string, string> Attribute type casts. */
    protected $casts = [
        'order_code'      => 'integer',
        'total_amount'    => 'integer',
        'discount_amount' => 'integer',
        'expires_at'      => 'datetime',
    ];

    /**
     * Get the user who placed this order.
     *
     * @return BelongsTo<User, Order>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Determine whether this order is expired.
     *
     * An order is expired when its `status` column is already "expired", OR
     * when the `expires_at` timestamp exists and is in the past (pending TTL
     * elapsed but the scheduler has not yet run).
     *
     * @return bool  True if the order should be considered expired.
     */
    public function isExpired(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }

        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Determine whether this order has been successfully paid.
     *
     * @return bool  True when `status` is "paid".
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Return the number of seconds remaining until the order expires.
     *
     * Used by the order page countdown timer. Returns 0 for already-expired
     * orders or orders without an expiry timestamp.
     *
     * @return int  Seconds remaining (≥ 0).
     */
    public function remainingSeconds(): int
    {
        if ($this->isExpired() || ! $this->expires_at) {
            return 0;
        }

        return max(0, (int) now()->diffInSeconds($this->expires_at, false));
    }
}
