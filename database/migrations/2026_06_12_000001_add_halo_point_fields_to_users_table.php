<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'halo_points_balance')) {
                $table->unsignedBigInteger('halo_points_balance')->default(0)->after('last_halo_date');
            }

            if (!Schema::hasColumn('users', 'is_suspended')) {
                $table->boolean('is_suspended')->default(false)->after('halo_points_balance');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_suspended')) {
                $table->dropColumn('is_suspended');
            }

            if (Schema::hasColumn('users', 'halo_points_balance')) {
                $table->dropColumn('halo_points_balance');
            }
        });
    }
};
