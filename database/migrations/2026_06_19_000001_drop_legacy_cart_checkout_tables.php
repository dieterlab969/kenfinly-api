<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Removes the local cart/checkout/PayOS tables that were replaced by the
 * WooCommerce webhook architecture. WordPress + WooCommerce now owns the
 * full checkout flow; Laravel acts only as a webhook consumer.
 *
 * Order matters: drop the tables that have no FK dependencies last,
 * but all three are standalone so order is arbitrary here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('shopping_cart');
        Schema::dropIfExists('payos_payment_orders');
        Schema::dropIfExists('orders');
    }

    /**
     * Rollback is intentionally a no-op.
     *
     * The original migration files for these tables still exist in the
     * migrations directory and can be re-run individually if a rollback
     * to the old architecture is ever required.
     */
    public function down(): void {}
};
