<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Represents a currency entry in the currencies lookup table.
 *
 * The primary key is the ISO 4217 currency code (VARCHAR), not an integer id.
 * is_active controls visibility in the app picker — only rows with
 * is_active = true are returned by GET /api/currencies.
 *
 * @property string $code           ISO 4217 code (e.g. "USD", "VND") — primary key.
 * @property string $name           Display name (e.g. "US Dollar").
 * @property string $symbol         Currency symbol (e.g. "$", "₫").
 * @property bool   $is_active      Whether the currency is visible in the app.
 * @property int    $display_order  UI sort order (ascending).
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 *
 * @package App\Models
 */
class Currency extends Model
{
    /**
     * The primary key column — a string code, not an auto-increment integer.
     *
     * @var string
     */
    protected $primaryKey = 'code';

    /**
     * The primary key type is a string (not integer).
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Disable auto-incrementing since the PK is a natural string key.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass-assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
        'symbol',
        'is_active',
        'display_order',
    ];

    /**
     * Attribute type casts.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active'     => 'boolean',
        'display_order' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Scopes & query helpers
    // -------------------------------------------------------------------------

    /**
     * Scope: only active currencies, sorted by display_order ascending.
     *
     * Mirrors the Language module's getActive() pattern for consistency.
     *
     * @param  Builder  $query
     * @return Builder
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->orderBy('display_order');
    }

    /**
     * Return all active currencies ordered by display_order.
     *
     * Equivalent SQL:
     *   SELECT * FROM currencies WHERE is_active = true ORDER BY display_order ASC;
     *
     * @return Collection<int, Currency>
     */
    public static function getActive(): Collection
    {
        return static::active()->get();
    }

    /**
     * Return only the codes of all active currencies.
     *
     * Used for validation rules (e.g. Rule::in(Currency::activeCodes())).
     *
     * @return list<string>
     */
    public static function activeCodes(): array
    {
        return static::where('is_active', true)->pluck('code')->all();
    }
}
