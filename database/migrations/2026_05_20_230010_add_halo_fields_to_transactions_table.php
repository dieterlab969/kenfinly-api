<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('transactions', 'ledger_type')) {
                $table->enum('ledger_type', ['real', 'halo'])->default('real')->after('user_id');
            }

            if (!Schema::hasColumn('transactions', 'amount_minor')) {
                $table->bigInteger('amount_minor')->nullable()->after('amount');
            }

            if (!Schema::hasColumn('transactions', 'currency')) {
                $table->string('currency', 3)->default('VND')->after('transaction_date');
            }

            if (!Schema::hasColumn('transactions', 'source_type')) {
                $table->enum('source_type', ['manual', 'halo_reward', 'import', 'adjustment'])->default('manual')->after('currency');
            }

            if (!Schema::hasColumn('transactions', 'source_id')) {
                $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            }

            if (!Schema::hasColumn('transactions', 'idempotency_key')) {
                $table->char('idempotency_key', 64)->nullable()->after('source_id');
            }
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->unique(['user_id', 'idempotency_key'], 'transactions_user_idempotency_unique');
            $table->index(['user_id', 'ledger_type', 'transaction_date', 'id'], 'txn_user_ledger_date_id_idx');
            $table->index(['user_id', 'ledger_type', 'created_at', 'id'], 'txn_user_ledger_created_id_idx');
            $table->index(['source_type', 'source_id'], 'txn_source_idx');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_amount_minor_non_zero CHECK (amount_minor IS NULL OR amount_minor <> 0)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE transactions DROP CHECK transactions_amount_minor_non_zero');
        }

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropUnique('transactions_user_idempotency_unique');
            $table->dropIndex('txn_user_ledger_date_id_idx');
            $table->dropIndex('txn_user_ledger_created_id_idx');
            $table->dropIndex('txn_source_idx');
            $table->dropColumn([
                'ledger_type',
                'amount_minor',
                'currency',
                'source_type',
                'source_id',
                'idempotency_key',
            ]);
        });
    }
};
