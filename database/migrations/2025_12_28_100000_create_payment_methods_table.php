<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // credit_card, paypal, stripe
            $table->string('provider')->default('stripe'); // stripe, paypal
            $table->string('last_four')->nullable(); // Last 4 digits of card
            $table->string('brand')->nullable(); // visa, mastercard, amex
            $table->string('expiry_month')->nullable();
            $table->string('expiry_year')->nullable();
            $table->string('holder_name')->nullable();
            $table->string('email')->nullable(); // For PayPal
            $table->string('provider_id')->nullable(); // Stripe payment method ID
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            
            $table->index(['user_id', 'is_default']);
            $table->index('provider_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
