<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a direct "Buy Now" payment order from the pricing page.
 *
 * This model tracks orders created when a user clicks a plan button on the
 * React pricing page, bypassing the cart flow. The PayOS SDK is called
 * directly from PayOSPaymentController::createPaymentLink(), which records
 * one row here before returning the hosted checkout URL to the frontend.
 *
 * Lifecycle statuses:
 *  - pending   → link created, awaiting PayOS webhook confirmation
 *  - completed → PayOS webhook confirmed successful payment (code "00")
 *  - failed    → PayOS webhook returned a non-success code
 *
 * The full verified webhook payload is stored in `payos_response` (JSON) for
 * audit and dispute-resolution purposes.
 *
 * @property int         $id
 * @property int         $user_id
 * @property int         $order_code      Numeric code shared with PayOS
 * @property string      $plan            "monthly" or "yearly"
 * @property int         $amount          Charged amount in VND
 * @property string      $status          "pending" | "completed" | "failed"
 * @property array|null  $payos_response  Decoded JSON of the verified webhook payload
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class PayosPaymentOrder extends Model
{
    /** @var list<string> Mass-assignable attributes. */
    protected $fillable = [
        'user_id',
        'order_code',
        'plan',
        'amount',
        'status',
        'payos_response',
    ];

    /** @var array<string, string> Attribute type casts. */
    protected $casts = [
        'order_code'     => 'integer',
        'amount'         => 'integer',
        'payos_response' => 'array',
    ];

    /**
     * Get the user who initiated this direct payment order.
     *
     * @return BelongsTo<User, PayosPaymentOrder>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
