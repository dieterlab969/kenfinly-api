<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('app_settings')->insert([
            'key' => 'google_tag_manager_id',
            'value' => 'G-HR6DW8D0GB',
            'type' => 'string',
            'description' => 'Google Tag Manager ID for analytics tracking',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('app_settings')->where('key', 'google_tag_manager_id')->delete();
    }
};
