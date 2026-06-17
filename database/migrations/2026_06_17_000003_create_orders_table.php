<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->bigInteger('order_code')->unique();
            $table->enum('plan', ['monthly', 'yearly']);
            $table->integer('total_amount');
            $table->string('coupon_applied', 50)->nullable();
            $table->integer('discount_amount')->default(0);
            $table->enum('status', ['pending', 'paid', 'expired'])->default('pending');
            $table->text('checkout_url')->nullable();
            $table->text('qr_code')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('order_code');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
