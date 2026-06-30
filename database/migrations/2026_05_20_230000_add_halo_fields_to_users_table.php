<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'timezone')) {
                $table->string('timezone', 64)->default('UTC')->after('password');
            }

            if (!Schema::hasColumn('users', 'hourly_rate')) {
                $table->bigInteger('hourly_rate')->default(100000)->after('timezone');
            }

            if (!Schema::hasColumn('users', 'rate_updated_at')) {
                $table->timestamp('rate_updated_at')->nullable()->after('hourly_rate');
            }

            if (!Schema::hasColumn('users', 'hourly_rate_locked_until')) {
                $table->timestamp('hourly_rate_locked_until')->nullable()->after('rate_updated_at');
            }

            if (!Schema::hasColumn('users', 'current_streak')) {
                $table->unsignedInteger('current_streak')->default(0)->after('hourly_rate_locked_until');
            }

            if (!Schema::hasColumn('users', 'longest_streak')) {
                $table->unsignedInteger('longest_streak')->default(0)->after('current_streak');
            }

            if (!Schema::hasColumn('users', 'last_halo_date')) {
                $table->date('last_halo_date')->nullable()->after('longest_streak');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index(['timezone', 'id'], 'users_timezone_id_idx');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE users ADD CONSTRAINT users_hourly_rate_non_negative CHECK (hourly_rate >= 0)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE users DROP CHECK users_hourly_rate_non_negative');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_timezone_id_idx');
            $table->dropColumn([
                'timezone',
                'hourly_rate',
                'rate_updated_at',
                'hourly_rate_locked_until',
                'current_streak',
                'longest_streak',
                'last_halo_date',
            ]);
        });
    }
};
