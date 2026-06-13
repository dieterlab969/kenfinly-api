<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Persist the single active Pomodoro timer state for a user.
 *
 * This model represents the cross-device restoration record used by the
 * Pomodoro sync engine. Each user may have at most one active state row,
 * keyed directly by the user's identifier.
 */
class PomodoroActiveState extends Model
{
    /**
     * The primary key associated with the table.
     *
     * @var string
     */
    protected $primaryKey = 'user_id';

    /**
     * Indicates if the model's primary key is auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Indicates if the model should maintain created_at and updated_at columns automatically.
     *
     * The table only stores a manually managed updated_at timestamp.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'client_timer_started_at',
        'duration_seconds',
        'is_paused',
        'remaining_seconds',
        'updated_at',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'user_id' => 'integer',
        'client_timer_started_at' => 'datetime',
        'duration_seconds' => 'integer',
        'is_paused' => 'boolean',
        'remaining_seconds' => 'integer',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who owns the active Pomodoro state.
     *
     * @return BelongsTo Relationship to the owning user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
