<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the currencies lookup table.
     *
     * Design rationale
     * ────────────────
     * • code is the natural primary key (ISO 4217 for fiat, ticker for crypto).
     * • is_active controls visibility in the app. Admin sets is_active = true
     *   only for currencies the product actively supports; all others are seeded
     *   but hidden, ready to be enabled without a deployment.
     * • display_order lets product decide the sort order in the picker UI
     *   independently of alphabetical or ISO ordering.
     * • No auto-increment id — the code itself is the stable identifier used in
     *   foreign keys on users.currency and transactions.currency.
     */
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {
            $table->string('code', 10)->primary();
            $table->string('name', 100);
            $table->string('symbol', 10);
            $table->boolean('is_active')->default(false)
                  ->comment('Only rows with is_active = true are returned by GET /api/currencies.');
            $table->integer('display_order')->default(0)
                  ->comment('Ascending sort order in the currency picker UI.');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
