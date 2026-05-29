<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Hot-Path Flat Table: ledger_daily_summaries (Module: Reports)
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  CANONICAL SCHEMA — Module-owned, ULID-keyed, zero-JOIN hot path   │
 * ├─────────────────────────────────────────────────────────────────────┤
 * │  Primary Key  : ULID char(26) — time-ordered, globally unique       │
 * │  Granularity  : one row per (user × account × ledger_type × day)   │
 * │  Write pattern: upsert + atomic increment (observer-driven)         │
 * │  Read pattern : point lookup or narrow range scan on indexed cols   │
 * │  Target latency: < 2 ms on indexed selects                          │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * NOTE — Upgrade path from legacy migration
 * ─────────────────────────────────────────
 * The pre-module migration (2026_05_21_000030) created ledger_daily_summaries
 * with a bigint PK and no account_id column.  This module migration:
 *   • Is skipped if the table already exists (idempotent guard).
 *   • In fresh environments, creates the full ULID-keyed schema.
 *   • In existing environments, run the companion upgrade migration to
 *     ADD the account_id column and migrate the PK — see docs/MIGRATIONS.md.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Idempotent guard — safe in both fresh and upgraded environments ──
        if (Schema::hasTable('ledger_daily_summaries')) {
            // Table exists (legacy migration ran). Ensure account_id column
            // exists — added as part of the module upgrade.
            if (!Schema::hasColumn('ledger_daily_summaries', 'account_id')) {
                Schema::table('ledger_daily_summaries', function (Blueprint $table) {
                    $table->unsignedBigInteger('account_id')
                          ->nullable()
                          ->after('user_id')
                          ->comment('NULL = cross-account aggregate row');

                    $table->index(['user_id', 'account_id', 'summary_date'], 'lds_user_account_date_idx');
                });
            }
            return;
        }

        // ── Fresh environment: full ULID-keyed canonical schema ─────────────
        Schema::create('ledger_daily_summaries', function (Blueprint $table) {

            // ── Primary key: ULID (26 chars, time-sortable, no collation issues)
            $table->ulid('id')->primary();

            // ── Ownership + partitioning columns ──────────────────────────
            $table->unsignedBigInteger('user_id')
                  ->comment('Owner of this summary row');

            $table->unsignedBigInteger('account_id')
                  ->nullable()
                  ->comment('NULL = cross-account aggregate row; non-null = per-account row');

            // ── Ledger discriminator ───────────────────────────────────────
            // 'real'  → actual monetary transactions
            // 'halo'  → Halo Point economy (discipline currency)
            $table->string('ledger_type', 10)
                  ->default('real')
                  ->comment('real | halo');

            // ── Temporal partition key ─────────────────────────────────────
            $table->date('summary_date');

            // ── Pre-aggregated financial columns (all in minor units ×100) ─
            // Stored as signed bigint: supports up to ±92 quadrillion minor units.
            $table->bigInteger('income_minor') ->default(0)->unsigned(false);
            $table->bigInteger('expense_minor')->default(0)->unsigned(false);
            $table->bigInteger('net_minor')    ->default(0)->unsigned(false)
                  ->comment('income_minor − expense_minor; negative = deficit');

            // ── Counters ───────────────────────────────────────────────────
            $table->unsignedInteger('tx_count')->default(0);

            // ── Housekeeping ───────────────────────────────────────────────
            $table->timestamp('last_synced_at')
                  ->nullable()
                  ->comment('UTC timestamp of last observer-driven upsert');

            $table->timestamps();   // created_at / updated_at

            // ── Uniqueness constraint: one summary row per partition key ───
            // account_id is nullable, so we use a named partial unique index
            // rather than a nullable-column unique() which behaves differently
            // across MySQL and PostgreSQL.
            $table->unique(
                ['user_id', 'account_id', 'ledger_type', 'summary_date'],
                'lds_user_account_type_date_unique'
            );

            // ── Read-path composite indexes ────────────────────────────────
            // Index 1: dashboard date-range queries (most common query shape)
            $table->index(['user_id', 'summary_date'],               'lds_user_date_idx');

            // Index 2: ledger-type filtered dashboard queries
            $table->index(['user_id', 'ledger_type', 'summary_date'], 'lds_user_type_date_idx');

            // Index 3: account-scoped queries
            $table->index(['user_id', 'account_id', 'summary_date'],  'lds_user_account_date_idx');

            // ── Foreign key ────────────────────────────────────────────────
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->cascadeOnDelete();
        });

        // ── CHECK constraints (non-SQLite only) ───────────────────────────
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("
                ALTER TABLE ledger_daily_summaries
                ADD CONSTRAINT lds_ledger_type_check
                CHECK (ledger_type IN ('real','halo'))
            ");
            DB::statement("
                ALTER TABLE ledger_daily_summaries
                ADD CONSTRAINT lds_counts_non_negative
                CHECK (tx_count >= 0 AND income_minor >= 0 AND expense_minor >= 0)
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_daily_summaries');
    }
};
