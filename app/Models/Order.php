<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a cart-based subscription checkout order.
 *
 * An Order is created by CheckoutController when a logged-in user submits
 * the cart form. It holds the PayOS order code, the chosen plan, final
 * amounts after any coupon discount, the PayOS QR / checkout URL, and a
 * reference back to the database-cart session that generated it.
 *
 * Lifecycle statuses:
 *  - pending   → created, awaiting payment confirmation
 *  - paid      → payment confirmed (PayOS webhook or PayPal capture)
 *  - expired   → TTL elapsed without payment (set by ExpireOldOrders command
 *                or lazily on read in orderStatus / show)
 *  - cancelled → user resubmitted checkout while this order was still pending;
 *                replaced by a fresh order linked to the same cart session
 *
 * Cart link:
 *  `cart_session_key` stores the PHP session ID that was active when the
 *  order was placed.  It matches the prefix used in `shopping_cart.cart_key`
 *  ({sessionId}_cart_items / {sessionId}_cart_conditions), providing a
 *  direct Quote→Order link without a separate quote table.
 *
 * @property int         $id
 * @property int         $user_id
 * @property string|null $cart_session_key  PHP session ID of the originating cart
 * @property int         $order_code        Numeric code shared with PayOS
 * @property string      $plan              "monthly" or "yearly"
 * @property int         $total_amount      Final charged amount in VND
 * @property string|null $coupon_applied    Coupon code used, if any
 * @property int         $discount_amount   Discount in VND (0 when no coupon)
 * @property float|null  $exchange_rate_used VND→USD rate locked at order time
 * @property string      $status            "pending" | "paid" | "expired" | "cancelled"
 * @property string      $gateway           "payos" | "paypal"
 * @property string|null $payment_reference External gateway order ID
 * @property string|null $checkout_url      PayOS hosted checkout URL
 * @property string|null $qr_code           PayOS QR code string
 * @property \Carbon\Carbon $expires_at     Timestamp after which the order expires
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Order extends Model
{
    /** @var list<string> Mass-assignable attributes. */
    protected $fillable = [
        'user_id',
        'cart_session_key',
        'order_code',
        'plan',
        'total_amount',
        'coupon_applied',
        'discount_amount',
        'exchange_rate_used',
        'status',
        'gateway',
        'payment_reference',
        'checkout_url',
        'qr_code',
        'expires_at',
    ];

    /** @var array<string, string> Attribute type casts. */
    protected $casts = [
        'order_code'         => 'integer',
        'total_amount'       => 'integer',
        'discount_amount'    => 'integer',
        'exchange_rate_used' => 'float',
        'expires_at'         => 'datetime',
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
