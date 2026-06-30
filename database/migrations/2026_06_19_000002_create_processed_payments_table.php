<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Idempotency log for WooCommerce webhook events.
 *
 * A row is written the moment a WooCommerce order is first accepted by
 * the /api/v1/woocommerce-callback endpoint. Before dispatching the
 * ProcessPremiumActivation job the controller checks this table — if a
 * record already exists for the incoming woo_order_id the webhook is
 * acknowledged (200 OK) immediately without re-processing.
 *
 * Columns:
 *  external_order_id — the WooCommerce order ID (e.g. "WC-12345").
 *                      UNIQUE + indexed to make the duplicate check an O(1)
 *                      index seek even under millions of rows.
 *  payment_method    — e.g. "paypal", "google_pay", "stripe". Stored for
 *                      audit/analytics; not used in business logic.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_payments', function (Blueprint $table) {
            $table->id();
            $table->string('external_order_id')->unique();
            $table->string('payment_method');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_payments');
    }
};
