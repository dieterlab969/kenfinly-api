<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('service_name', 255);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('VND');
            $table->enum('billing_cycle', ['WEEKLY', 'MONTHLY', 'YEARLY'])->default('MONTHLY');
            $table->date('next_billing_date');
            $table->boolean('is_trial')->default(false);
            $table->enum('status', ['ACTIVE', 'EXPIRED'])->default('ACTIVE');
            $table->boolean('is_deleted')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'status', 'is_deleted']);
            $table->index('next_billing_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_subscriptions');
    }
};
