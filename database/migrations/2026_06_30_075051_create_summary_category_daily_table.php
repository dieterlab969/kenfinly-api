<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pre-aggregated daily spend table for the Analytics module.
     *
     * Design rationale
     * ────────────────
     * • Avoids full-table SUM across the raw transactions table on every
     *   analytics request; a nightly cron job pre-computes the previous
     *   day's spend per (user, category) and writes it here.
     * • The compound index idx_user_date_analytics covers the primary
     *   access pattern: filter by user_id then scan a date range.
     * • total_spend uses NUMERIC(15,2) to match the transaction.amount
     *   precision; no floating-point surprises.
     */
    public function up(): void
    {
        Schema::create('summary_category_daily', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->integer('category_id');
            $table->date('log_date');
            $table->decimal('total_spend', 15, 2)->default(0.00);
            $table->integer('transaction_count')->default(0);
            $table->timestamp('created_at')->useCurrent();

            // Compound index for the analytics query pattern
            $table->index(['user_id', 'log_date'], 'idx_user_date_analytics');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('summary_category_daily');
    }
};
