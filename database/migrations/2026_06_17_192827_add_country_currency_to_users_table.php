<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // ISO 3166-1 alpha-2 code detected via IP or set by the user.
            // Nullable — existing users predate this feature.
            $table->char('country_code', 2)->nullable()->after('language_id')
                  ->comment('Detected or user-set country code, e.g. VN, US');

            // VND → routes to PayOS / VietQR
            // USD → routes to PayPal
            // Defaults to VND (server is in Vietnam).
            $table->string('currency', 3)->default('VND')->after('country_code')
                  ->comment('Preferred payment currency: VND or USD');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['country_code', 'currency']);
        });
    }
};
