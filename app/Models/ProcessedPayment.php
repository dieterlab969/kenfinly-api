<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Lightweight idempotency record for WooCommerce webhook events.
 *
 * A row is inserted the moment a WooCommerce order is first processed by
 * WooCommerceWebhookController. Before activating any premium features the
 * controller checks this table to prevent duplicate activations under
 * WooCommerce's automatic webhook retry mechanism.
 *
 * @property int    $id
 * @property string $external_order_id  WooCommerce order ID (e.g. "WC-12345")
 * @property string $payment_method     e.g. 'paypal', 'google_pay', 'stripe'
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class ProcessedPayment extends Model
{
    protected $fillable = [
        'external_order_id',
        'payment_method',
    ];
}
