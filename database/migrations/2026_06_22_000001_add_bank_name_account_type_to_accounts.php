<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ensure the accounts table has an account_type column for compatibility.
 * Defaults to 'wallet' — the only type used in the standalone wallet model.
 *
 * Note: bank_name was removed as part of the YAGNI simplification; the Account
 * entity is a standalone wallet and carries no bank-specific metadata.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('account_type', 30)->default('wallet')->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('account_type');
        });
    }
};
