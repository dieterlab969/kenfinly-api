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
        Schema::create('licenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Remove the foreign key constraint here, just create the column
            $table->unsignedBigInteger('subscription_id')->nullable();

            $table->string('license_key')->unique();
            $table->enum('status', ['active', 'expired', 'revoked', 'trial'])->default('trial');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->integer('max_users')->default(1);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index('expires_at');
        });

        // Add a separate step to add the foreign key constraint after all tables exist
        Schema::table('licenses', function (Blueprint $table) {
            // Only add the constraint if the subscriptions table exists
            if (Schema::hasTable('subscriptions')) {
                $table->foreign('subscription_id')
                    ->references('id')
                    ->on('subscriptions')
                    ->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('licenses');
    }
};
