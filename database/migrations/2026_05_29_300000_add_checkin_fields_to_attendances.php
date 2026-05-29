<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds check-in time enforcement columns to the attendances table.
 *
 * check_in_type  — 'on_time' (6:00–8:30 AM) | 'late' (after 8:30 AM)
 *                  null only during the brief instant before the row is written.
 *
 * reminder_count — 0 = no reminders sent yet
 *                  1 = 1st reminder sent (at 8:00 PM)
 *                  2 = 2nd reminder sent (at 8:30 PM); auto-kill fires at 10:00 PM
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Check-in type — determines max ring progress on the frontend
            $table->string('check_in_type', 10)
                  ->nullable()
                  ->after('status')
                  ->comment('on_time (6:00–8:30 AM) | late (after 8:30 AM). NULL = not yet checked in.');

            // Reminder email count — capped at 2 by the ProcessHaloReminders command
            $table->unsignedTinyInteger('reminder_count')
                  ->default(0)
                  ->after('reminder_sent_at')
                  ->comment('0 = no reminders sent, 1 = first sent at 20:00, 2 = second sent at 20:30');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['check_in_type', 'reminder_count']);
        });
    }
};
