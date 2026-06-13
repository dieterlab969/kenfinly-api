<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add fixed semi-annual review windows to existing hourly rate logs.
     *
     * Existing rows are backfilled by interpreting their creation timestamps in
     * the user's timezone so historical governance data remains meaningful.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::table('user_rate_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('user_rate_logs', 'review_window')) {
                $table->enum('review_window', ['H1', 'H2'])->default('H1')->after('allowance_year');
            }
        });

        DB::table('user_rate_logs')
            ->join('users', 'users.id', '=', 'user_rate_logs.user_id')
            ->select('user_rate_logs.id', 'user_rate_logs.created_at', 'users.timezone')
            ->orderBy('user_rate_logs.id')
            ->chunk(100, function ($logs): void {
                foreach ($logs as $log) {
                    $timezone = $log->timezone ?: config('app.timezone', 'UTC');
                    $reviewWindow = CarbonImmutable::parse($log->created_at)
                        ->setTimezone($timezone)
                        ->month <= 6 ? 'H1' : 'H2';

                    DB::table('user_rate_logs')
                        ->where('id', $log->id)
                        ->update(['review_window' => $reviewWindow]);
                }
            });

        Schema::table('user_rate_logs', function (Blueprint $table) {
            $table->index(['user_id', 'allowance_year', 'review_window'], 'user_rate_logs_user_year_window_idx');
        });
    }

    /**
     * Remove the fixed semi-annual review window column and index.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::table('user_rate_logs', function (Blueprint $table) {
            $table->dropIndex('user_rate_logs_user_year_window_idx');
            $table->dropColumn('review_window');
        });
    }
};
