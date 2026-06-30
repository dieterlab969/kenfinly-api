<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add exchange_rate_used to the orders table.
     *
     * Stores the exact USD/VND rate that was in effect at the moment a PayPal
     * order was created.  Locking this rate means we can always reconstruct the
     * exact USD amount that was charged, even if the live rate drifts later.
     *
     * Nullable so that PayOS (VND-only) orders, which need no conversion, never
     * have a meaningless value stored against them.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('exchange_rate_used', 12, 4)
                  ->nullable()
                  ->after('discount_amount')
                  ->comment('USD→VND rate locked at PayPal checkout time; null for PayOS orders');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('exchange_rate_used');
        });
    }
};
