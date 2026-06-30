<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('subscription_status', ['trial', 'active', 'revoked', 'expired'])
                ->default('trial')
                ->after('status');
            $table->enum('subscription_plan', ['free', 'monthly', 'yearly'])
                ->default('free')
                ->after('subscription_status');
            $table->timestamp('trial_ends_at')->nullable()->after('subscription_plan');
            $table->timestamp('subscription_expires_at')->nullable()->after('trial_ends_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_status',
                'subscription_plan',
                'trial_ends_at',
                'subscription_expires_at',
            ]);
        });
    }
};
