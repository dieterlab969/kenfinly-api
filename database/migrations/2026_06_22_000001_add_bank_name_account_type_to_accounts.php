<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extend the accounts table with two optional metadata columns:
 *
 *  bank_name    — the institution name (e.g. "Vietcombank", "BIDV"). Nullable
 *                 so that cash-wallet and non-bank accounts are not forced to fill it.
 *
 *  account_type — the category of the account. Allowed values:
 *                 wallet | bank | savings | credit_card | investment
 *                 Defaults to "wallet" so that existing rows are unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('bank_name', 100)->nullable()->after('color');
            $table->string('account_type', 30)->default('wallet')->after('bank_name');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'account_type']);
        });
    }
};
