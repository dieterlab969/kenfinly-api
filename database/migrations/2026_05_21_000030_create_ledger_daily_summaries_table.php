<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('ledger_type', ['real', 'halo']);
            $table->date('summary_date');
            $table->bigInteger('income_minor')->default(0);
            $table->bigInteger('expense_minor')->default(0);
            $table->bigInteger('net_minor')->default(0);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'ledger_type', 'summary_date'], 'ledger_daily_user_ledger_date_unique');
            $table->index(['summary_date', 'ledger_type'], 'ledger_daily_date_ledger_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledger_daily_summaries');
    }
};
