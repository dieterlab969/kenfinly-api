<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'description'];

    public static function get(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            return $default;
        }

        return match($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $setting->value,
            'float' => (float) $setting->value,
            'json' => json_decode($setting->value, true),
            default => $setting->value,
        };
    }

    public static function set(string $key, $value, string $type = 'string'): void
    {
        $valueToStore = match($type) {
            'boolean' => $value ? 'true' : 'false',
            'json' => json_encode($value),
            default => (string) $value,
        };

        self::updateOrCreate(
            ['key' => $key],
            ['value' => $valueToStore, 'type' => $type]
        );
    }

    public static function isRecaptchaEnabled(): bool
    {
        return self::get('recaptcha_enabled', false);
    }

    public static function getGoogleTagManagerId(): ?string
    {
        return self::get('google_tag_manager_id');
    }

    public static function isGA4Enabled(): bool
    {
        // Check environment variable first (can be overridden per environment)
        if (env('GA4_ENABLED') !== null) {
            // If a value exists, it is safely converted to a boolean (true / false).
            return filter_var(env('GA4_ENABLED'), FILTER_VALIDATE_BOOLEAN); 
        }
        
        // Fall back to app setting
        return self::get('ga4_enabled', false);
    }
}
