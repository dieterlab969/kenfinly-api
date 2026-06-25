<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the four security-toggle columns and the hashed-PIN column to the
 * users table.
 *
 * Columns added:
 *  - is_2fa_enabled                 (boolean, default false)
 *  - is_biometric_enabled           (boolean, default false)
 *  - login_notifications_enabled    (boolean, default true)
 *  - security_alerts_enabled        (boolean, default true)
 *  - pin_hash                       (nullable string — bcrypt hash of user PIN)
 *
 * All additions are idempotent and guarded with hasColumn() checks.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_2fa_enabled')) {
                $table->boolean('is_2fa_enabled')->default(false)->after('gender');
            }

            if (! Schema::hasColumn('users', 'is_biometric_enabled')) {
                $table->boolean('is_biometric_enabled')->default(false)->after('is_2fa_enabled');
            }

            if (! Schema::hasColumn('users', 'login_notifications_enabled')) {
                $table->boolean('login_notifications_enabled')->default(true)->after('is_biometric_enabled');
            }

            if (! Schema::hasColumn('users', 'security_alerts_enabled')) {
                $table->boolean('security_alerts_enabled')->default(true)->after('login_notifications_enabled');
            }

            if (! Schema::hasColumn('users', 'pin_hash')) {
                $table->string('pin_hash')->nullable()->after('security_alerts_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = [
                'is_2fa_enabled',
                'is_biometric_enabled',
                'login_notifications_enabled',
                'security_alerts_enabled',
                'pin_hash',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
