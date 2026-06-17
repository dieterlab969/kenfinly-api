<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds `cart_session_key` to the orders table.
 *
 * The value is the PHP session ID that was active when the order was placed.
 * It matches the prefix used in `shopping_cart.cart_key`, creating a direct
 * link between an Order and its source DB-cart rows — the Magento Quote/Order
 * analogue.
 *
 * Usage in CheckoutController::store():
 *   - Any existing pending order with the same (user_id, cart_session_key)
 *     is cancelled before the new order is created, replacing the old
 *     time-window heuristic.
 *
 * Usage in PayOSPaymentController::handleCartOrder():
 *   - After payment confirmed, the DB-cart rows are cleared via this key.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('cart_session_key')
                  ->nullable()
                  ->after('user_id')
                  ->index();
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('cart_session_key');
        });
    }
};
