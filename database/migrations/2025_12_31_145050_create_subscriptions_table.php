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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('plan_id');
            $table->unsignedBigInteger('payment_gateway_id')->nullable();
            $table->string('status')->default('active')->index();
            $table->string('gateway_subscription_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('USD');
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->dateTime('canceled_at')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('subscription_plans')->onDelete('restrict');
            $table->foreign('payment_gateway_id')->references('id')->on('payment_gateways')->onDelete('set null');
            $table->unique(['user_id', 'plan_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
