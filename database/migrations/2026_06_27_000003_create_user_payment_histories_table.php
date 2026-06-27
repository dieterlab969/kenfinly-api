<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_payment_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_subscription_id')
                  ->constrained('user_subscriptions')
                  ->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('amount_paid', 12, 2);
            $table->string('currency', 10)->default('VND');
            $table->timestamp('payment_date')->useCurrent();
            $table->enum('status', ['SUCCESS', 'FAILED'])->default('SUCCESS');
            $table->text('failure_reason')->nullable();
            $table->string('transaction_code', 100)->nullable()->unique();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_payment_histories');
    }
};
