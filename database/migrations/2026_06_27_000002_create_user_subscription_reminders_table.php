<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_subscription_reminders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_subscription_id')
                  ->constrained('user_subscriptions')
                  ->onDelete('cascade');
            $table->integer('remind_before_days')->default(3);
            $table->json('channels')->comment('Array of: email, push');
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('last_reminded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_subscription_reminders');
    }
};
