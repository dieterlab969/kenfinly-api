<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payos_payment_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->bigInteger('order_code')->unique();
            $table->enum('plan', ['monthly', 'yearly']);
            $table->integer('amount');
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->json('payos_response')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('order_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payos_payment_orders');
    }
};
