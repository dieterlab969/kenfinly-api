<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\Translation;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    public function run(): void
    {
        $english = Language::firstOrCreate(
            ['code' => 'en'],
            [
                'name' => 'English',
                'native_name' => 'English',
                'is_default' => true,
                'is_active' => true,
            ]
        );

        $vietnamese = Language::firstOrCreate(
            ['code' => 'vi'],
            [
                'name' => 'Vietnamese',
                'native_name' => 'Tiếng Việt',
                'is_default' => false,
                'is_active' => true,
            ]
        );

        $manifestPath = resource_path('lang/translations.json');
        $manifestData = json_decode(file_get_contents($manifestPath), true);

        $translations = [];
        foreach ($manifestData as $key => $values) {
            $translations[$key] = $values;
        }

        foreach ($translations as $key => $values) {
            if (isset($values['en']) && isset($values['vi'])) {
                Translation::updateOrCreate(
                    ['language_id' => $english->id, 'key' => $key],
                    ['value' => $values['en']]
                );
                Translation::updateOrCreate(
                    ['language_id' => $vietnamese->id, 'key' => $key],
                    ['value' => $values['vi']]
                );
            }
        }

        $this->command->info('Languages and translations seeded successfully!');
    }
}
