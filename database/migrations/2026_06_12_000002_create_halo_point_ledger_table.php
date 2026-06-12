<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halo_point_ledger', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('transaction_type', ['welcome_bonus', 'survival_reward', 'promise_lock', 'promise_burn']);
            $table->integer('amount');
            $table->char('previous_hash', 64);
            $table->char('current_hash', 64);
            $table->timestamps();

            $table->index(['user_id', 'id'], 'halo_point_ledger_user_id_id_idx');
            $table->index(['user_id', 'transaction_type'], 'halo_point_ledger_user_transaction_type_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('halo_point_ledger');
    }
};
