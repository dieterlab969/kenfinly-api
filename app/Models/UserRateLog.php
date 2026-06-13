<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Store append-only audit logs for hourly rate review updates.
 *
 * Each log captures the previous rate, the new rate, the calendar year, and
 * the fixed review window in which the user performed the change.
 */
class UserRateLog extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'old_rate',
        'new_rate',
        'allowance_year',
        'review_window',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'old_rate' => 'integer',
        'new_rate' => 'integer',
        'allowance_year' => 'integer',
        'review_window' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who owns this hourly rate log entry.
     *
     * @return BelongsTo Relationship to the owning user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
