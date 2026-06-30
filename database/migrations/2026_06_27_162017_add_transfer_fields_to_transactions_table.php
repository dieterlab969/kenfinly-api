<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            // Allow NULL so wallet-transfer records need no category.
            // Regular income/expense records still require a category —
            // that constraint is enforced at the application layer.
            $table->unsignedBigInteger('category_id')->nullable()->change();

            // Cross-link between the two paired transfer records.
            // The debit side and the credit side each store the other's ID.
            // Cleared automatically when the paired record is deleted.
            if (!Schema::hasColumn('transactions', 'transfer_pair_id')) {
                $table->unsignedBigInteger('transfer_pair_id')
                    ->nullable()
                    ->after('source_id');

                $table->foreign('transfer_pair_id', 'txn_transfer_pair_fk')
                    ->references('id')
                    ->on('transactions')
                    ->nullOnDelete();

                $table->index('transfer_pair_id', 'txn_transfer_pair_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'transfer_pair_id')) {
                $table->dropForeign('txn_transfer_pair_fk');
                $table->dropIndex('txn_transfer_pair_idx');
                $table->dropColumn('transfer_pair_id');
            }
            $table->unsignedBigInteger('category_id')->nullable(false)->change();
        });
    }
};
