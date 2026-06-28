<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the two columns required for the dynamic language-picker feature.
 *
 * is_rtl          — signals right-to-left layout (Arabic, Hebrew, etc.)
 *                   The frontend maps this to the HTML `dir` attribute.
 *
 * display_order   — integer sort key that determines the order languages
 *                   appear in the /Language UI. The GET /api/languages
 *                   endpoint sorts by this column so the UI order is
 *                   controlled entirely from the database without a code
 *                   rebuild.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->boolean('is_rtl')->default(false)->after('is_active');
            $table->integer('display_order')->default(0)->after('is_rtl');

            // Existing `code` column has a UNIQUE index — also add a plain
            // index on display_order so ORDER BY display_order is fast.
            $table->index('display_order', 'languages_display_order_idx');
        });
    }

    public function down(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->dropIndex('languages_display_order_idx');
            $table->dropColumn(['is_rtl', 'display_order']);
        });
    }
};
