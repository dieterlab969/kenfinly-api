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
            // Tracks when a 'pending_deletion' account will be hard-deleted.
            // NULL means the account is not scheduled for deletion.
            // An Artisan scheduled command deletes accounts whose
            // deletion_scheduled_at timestamp has passed.
            $table->timestamp('deletion_scheduled_at')->nullable()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('deletion_scheduled_at');
        });
    }
};
