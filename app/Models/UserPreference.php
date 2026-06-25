<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Stores a user's marketing email communication preferences.
 *
 * There is a one-to-one relationship between {@see User} and this model,
 * enforced by a unique index on `user_id`. A row is created automatically
 * on the user's first visit to the Marketing Preferences screen.
 *
 * @property int         $id
 * @property int         $user_id        Foreign key to the users table.
 * @property bool        $email_news     Receive product news and benefit updates via email.
 * @property bool        $email_offers   Receive partner discount and offer emails.
 * @property bool        $email_surveys  Receive survey / feedback invitation emails.
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 *
 * @package App\Models
 */
class UserPreference extends Model
{
    /**
     * The attributes that are mass-assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'email_news',
        'email_offers',
        'email_surveys',
    ];

    /**
     * Attribute type casts.
     *
     * All three toggle columns are stored as booleans so Eloquent returns
     * native PHP `true`/`false` values instead of the database integers
     * `1`/`0`.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_news'    => 'boolean',
        'email_offers'  => 'boolean',
        'email_surveys' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * The user who owns these preferences.
     *
     * @return BelongsTo<User, UserPreference>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Return the default attribute values used when creating a first-time row.
     *
     * Defaults are intentionally conservative: news is opt-in by default while
     * offers and surveys are opt-out, matching typical privacy-friendly patterns.
     *
     * @param  int   $userId  The ID of the user the defaults are being created for.
     * @return array<string, int|bool>
     */
    public static function defaults(int $userId): array
    {
        return [
            'user_id'       => $userId,
            'email_news'    => true,
            'email_offers'  => false,
            'email_surveys' => false,
        ];
    }
}
