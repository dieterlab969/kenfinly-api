<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Language model.
 *
 * Each row represents one UI language that the app supports.
 * The GET /api/languages endpoint exposes only rows where is_active = true,
 * ordered by display_order — so enabling/disabling a language and setting its
 * position is purely a database operation with no frontend rebuild required.
 *
 * Columns added in migration 2026_06_22_000003:
 *   is_rtl         (boolean, default false) — drives document dir attribute
 *   display_order  (integer, default 0)    — sort order in the language picker
 */
class Language extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'native_name',
        'is_default',
        'is_active',
        'is_rtl',
        'display_order',
    ];

    protected $casts = [
        'is_default'    => 'boolean',
        'is_active'     => 'boolean',
        'is_rtl'        => 'boolean',
        'display_order' => 'integer',
    ];

    // ── Relationships ─────────────────────────────────────────────────────

    public function translations(): HasMany
    {
        return $this->hasMany(Translation::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    // ── Scoped queries ────────────────────────────────────────────────────

    /**
     * Return the single default language (fallback for new users).
     */
    public static function getDefault(): ?self
    {
        return self::where('is_default', true)->first();
    }

    /**
     * Return all active languages ordered for the UI.
     *
     * Contract (required by GET /api/languages):
     *   WHERE  is_active = true
     *   ORDER  display_order ASC, name ASC
     *
     * The sort is deliberately done here in the model so every caller
     * (controller, tests, seeders) gets the same consistent order.
     */
    public static function getActive()
    {
        return self::where('is_active', true)
            ->orderBy('display_order')
            ->orderBy('name')
            ->get();
    }
}
