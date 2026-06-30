<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\Translation;
use Illuminate\Database\Seeder;

/**
 * Seeds the two initially active languages (English US and Vietnamese) and
 * their translations from the shared translations.json manifest.
 *
 * IDEMPOTENT — safe to run multiple times:
 *   - updateOrCreate on `code` means re-running updates existing rows.
 *   - Translation::updateOrCreate on (language_id, key) is likewise safe.
 *
 * ADDING MORE LANGUAGES:
 *   1. Add a row here with is_active = false.
 *   2. Flip is_active to true in the database when ready.
 *   No frontend rebuild is required — the /Language page fetches
 *   GET /api/languages dynamically and renders whatever is active.
 */
class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        // ── Active languages ────────────────────────────────────────────────
        // Only en-US and vi-VN are active; all others default to is_active = false.
        // display_order controls the sort order shown in the Language picker.

        $english = Language::updateOrCreate(
            ['code' => 'en-US'],
            [
                'name'          => 'English (US)',
                'native_name'   => 'English (US)',
                'is_default'    => true,
                'is_active'     => true,
                'is_rtl'        => false,
                'display_order' => 1,
            ]
        );

        $vietnamese = Language::updateOrCreate(
            ['code' => 'vi-VN'],
            [
                'name'          => 'Vietnamese',
                'native_name'   => 'Tiếng Việt',
                'is_default'    => false,
                'is_active'     => true,
                'is_rtl'        => false,
                'display_order' => 2,
            ]
        );

        // ── Inactive languages (available to activate later) ────────────────
        // Activate any of these from the database — the frontend will pick them
        // up automatically on the next page load.

        $inactiveLanguages = [
            ['code' => 'en-GB', 'name' => 'English (UK)',   'native_name' => 'English (UK)',  'is_rtl' => false, 'display_order' => 3],
            ['code' => 'zh-CN', 'name' => 'Chinese (Simplified)', 'native_name' => '中文',    'is_rtl' => false, 'display_order' => 4],
            ['code' => 'ja-JP', 'name' => 'Japanese',       'native_name' => '日本語',         'is_rtl' => false, 'display_order' => 5],
            ['code' => 'ko-KR', 'name' => 'Korean',         'native_name' => '한국어',          'is_rtl' => false, 'display_order' => 6],
            ['code' => 'fr-FR', 'name' => 'French',         'native_name' => 'Français',       'is_rtl' => false, 'display_order' => 7],
            ['code' => 'es-ES', 'name' => 'Spanish',        'native_name' => 'Español',        'is_rtl' => false, 'display_order' => 8],
            ['code' => 'de-DE', 'name' => 'German',         'native_name' => 'Deutsch',        'is_rtl' => false, 'display_order' => 9],
            ['code' => 'hi-IN', 'name' => 'Hindi',          'native_name' => 'हिन्दी',          'is_rtl' => false, 'display_order' => 10],
            ['code' => 'ar-SA', 'name' => 'Arabic',         'native_name' => 'العربية',        'is_rtl' => true,  'display_order' => 11],
        ];

        foreach ($inactiveLanguages as $lang) {
            Language::updateOrCreate(
                ['code' => $lang['code']],
                array_merge($lang, [
                    'is_default' => false,
                    'is_active'  => false,
                ])
            );
        }

        // ── Translations ────────────────────────────────────────────────────
        // The manifest at resources/lang/translations.json is the source of truth.
        // Keys use 'en' and 'vi' locale codes (i18next convention).

        $manifestPath = resource_path('lang/translations.json');

        if (! file_exists($manifestPath)) {
            $this->command->warn('translations.json not found — skipping translation seed.');
            $this->command->info('Languages seeded successfully!');
            return;
        }

        $manifestData = json_decode(file_get_contents($manifestPath), true);

        foreach ($manifestData as $key => $values) {
            if (isset($values['en'])) {
                Translation::updateOrCreate(
                    ['language_id' => $english->id, 'key' => $key],
                    ['value' => $values['en']]
                );
            }
            if (isset($values['vi'])) {
                Translation::updateOrCreate(
                    ['language_id' => $vietnamese->id, 'key' => $key],
                    ['value' => $values['vi']]
                );
            }
        }

        $this->command->info('Languages and translations seeded successfully!');
    }
}
