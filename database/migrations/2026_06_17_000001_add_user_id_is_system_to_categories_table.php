<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Safe, backward-compatible migration:
     *
     *  • Adds `user_id`  — null = global system category, set = user-defined
     *  • Adds `is_system` — true = protected, users cannot edit/delete
     *
     * All existing rows (seeded globals) are retroactively marked is_system=true
     * so old data is preserved with no functional change.
     */
    public function up(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')
                ->nullable()
                ->after('parent_id')
                ->comment('null = global system category; set = owned by this user');

            $table->boolean('is_system')
                ->default(false)
                ->after('user_id')
                ->comment('true = protected, cannot be edited or deleted by users');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });

        // Retroactively protect all pre-existing (seeded) categories
        DB::table('categories')
            ->whereNull('user_id')
            ->update(['is_system' => true]);
    }

    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'is_system']);
        });
    }
};
