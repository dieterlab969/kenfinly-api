<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Ledger category daily summaries — pre-aggregated, write-time rollup table.
 *
 * One row per (user, account, category, type, date).
 * Queries over this table are O(days × categories) — never O(transactions).
 * Target read latency: < 5 ms on indexed lookups.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_category_daily_summaries', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('account_id');
            $table->unsignedBigInteger('category_id')->nullable();

            // Cached denormalised fields — avoids JOINs at read time
            $table->string('category_name', 120)->default('Uncategorized');
            $table->string('color_hex', 7)->default('#6B7280');

            $table->string('type', 10);        // 'income' | 'expense'
            $table->date('summary_date');

            $table->bigInteger('amount_minor')->default(0);   // sum of (amount * 100)
            $table->unsignedInteger('tx_count')->default(0);

            $table->timestamps();

            // ── Unique guard: one summary row per (user, account, category, type, day)
            $table->unique(
                ['user_id', 'account_id', 'category_id', 'type', 'summary_date'],
                'lcds_user_account_cat_type_date_unique'
            );

            // ── Read-path indexes (analytics queries)
            $table->index(['user_id', 'summary_date', 'type'],          'lcds_user_date_type_idx');
            $table->index(['user_id', 'account_id', 'summary_date'],    'lcds_user_account_date_idx');
            $table->index('category_id',                                 'lcds_category_idx');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        // CHECK constraint to guard against negative amounts (skip on SQLite — not supported)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement(
                'ALTER TABLE ledger_category_daily_summaries
                 ADD CONSTRAINT lcds_amount_minor_non_negative CHECK (amount_minor >= 0)'
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_category_daily_summaries');
    }
};
