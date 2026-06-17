<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // gateway: which processor handled this order ("payos" | "paypal")
            $table->string('gateway')->default('payos')->after('status');
            // payment_reference: external gateway's own order identifier
            // (PayPal Order ID for PayPal; null for PayOS which uses order_code)
            $table->string('payment_reference')->nullable()->after('gateway');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['gateway', 'payment_reference']);
        });
    }
};
