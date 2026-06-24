<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Production-grade hardening for the accounts ↔ transactions relationship.
 *
 * WHAT THIS MIGRATION DOES
 * ────────────────────────
 * 1. Adds a composite index on accounts(user_id, currency)
 *    — Optimises the multi-currency total aggregation used by the dashboard
 *      and wallet list.  Without this, a full accounts table scan is needed
 *      for every currency-grouped SUM/GROUP query on a multi-user table.
 *
 * 2. Changes the FK on transactions.account_id from CASCADE to RESTRICT
 *    — The AccountController already guards against deletion via an application-
 *      level check (hasTransactions()), but that check is bypassed by direct
 *      DB queries (migration scripts, admin tools, Tinker).
 *    — RESTRICT makes the database the final safety net: an account with
 *      transactions cannot be deleted at ANY layer, preserving financial history
 *      even if the application code is bypassed.
 *
 * WHY NOT IN THE ORIGINAL MIGRATIONS?
 * ─────────────────────────────────────
 * The original create_accounts_table and create_transactions_table migrations
 * were written before the multi-tenant query patterns and the strict deletion
 * policy were finalised.  This migration adds the missing constraints without
 * requiring a destructive re-run of existing migrations.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Performance index on accounts for multi-currency aggregations.
        Schema::table('accounts', function (Blueprint $table) {
            $table->index(['user_id', 'currency'], 'accounts_user_currency_idx');
        });

        // 2. Promote transactions.account_id FK from CASCADE to RESTRICT.
        Schema::table('transactions', function (Blueprint $table) {
            // Drop the existing cascade FK first.
            // Laravel infers the name as {table}_{column}_foreign.
            $table->dropForeign(['account_id']);

            // Re-add with RESTRICT so the DB engine rejects any DELETE on an
            // account that still has transaction rows, regardless of who issues
            // the DELETE (API, Artisan, Tinker, or a migration script).
            $table->foreign('account_id')
                ->references('id')
                ->on('accounts')
                ->onDelete('restrict');
        });
    }

    public function down(): void
    {
        // Reverse the FK change first (transactions references accounts).
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['account_id']);

            $table->foreign('account_id')
                ->references('id')
                ->on('accounts')
                ->onDelete('cascade');
        });

        // Drop the performance index.
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex('accounts_user_currency_idx');
        });
    }
};
