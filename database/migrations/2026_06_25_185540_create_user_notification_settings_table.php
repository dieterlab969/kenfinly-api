<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the user_notification_settings table. Each user has exactly one
     * row (enforced by the unique index on user_id). Rows are created lazily on
     * first access with the defaults defined in UserNotificationSetting::defaults().
     *
     * Columns map to financial notifications that are actually supported by the
     * Kenfinly application. Wallet / P2P payment notifications (QR, direct
     * transfer, money requests) have been intentionally excluded as those
     * features do not exist in this product.
     */
    public function up(): void
    {
        Schema::create('user_notification_settings', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->unique()
                  ->constrained('users')
                  ->cascadeOnDelete();

            // ── Financial activity ────────────────────────────────────────────
            $table->boolean('notify_new_transaction')->default(true)
                  ->comment('A new transaction is recorded on the user\'s account.');

            $table->boolean('notify_budget_alert')->default(true)
                  ->comment('A budget threshold is approaching or has been exceeded.');

            $table->boolean('notify_large_transaction')->default(true)
                  ->comment('An unusually large or suspicious transaction is detected.');

            // ── Savings & goals ───────────────────────────────────────────────
            $table->boolean('notify_savings_milestone')->default(true)
                  ->comment('A saving habit streak or savings milestone is reached.');

            // ── Collaboration ─────────────────────────────────────────────────
            $table->boolean('notify_account_invite')->default(true)
                  ->comment('Another user invites you to collaborate on an account.');

            // ── Account & subscription ────────────────────────────────────────
            $table->boolean('notify_subscription')->default(true)
                  ->comment('Subscription renewal reminder or payment confirmation.');

            // ── Digest ────────────────────────────────────────────────────────
            $table->boolean('notify_weekly_summary')->default(false)
                  ->comment('Weekly email digest summarising spending and income.');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_notification_settings');
    }
};
