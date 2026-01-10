<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $logos = [
            ['key' => 'logo_1x', 'description' => 'Default logo (1x resolution)'],
            ['key' => 'logo_2x', 'description' => 'Retina logo (2x resolution)'],
            ['key' => 'logo_4x', 'description' => 'High resolution logo (4x resolution)'],
        ];

        foreach ($logos as $logo) {
            DB::table('app_settings')->insert([
                'key' => $logo['key'],
                'value' => '',
                'type' => 'string',
                'description' => $logo['description'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('app_settings')->whereIn('key', ['logo_1x', 'logo_2x', 'logo_4x'])->delete();
    }
};
