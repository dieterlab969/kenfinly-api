<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Record completed or interrupted Pomodoro focus sessions.
 *
 * Historical Pomodoro sessions are stored separately from the active timer
 * state so the application can provide analytics and durable activity logs
 * without mutating in-progress state records.
 */
class PomodoroSession extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'started_at',
        'completed_at',
        'status',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'status' => 'string',
    ];

    /**
     * Get the user who owns this Pomodoro session.
     *
     * @return BelongsTo Relationship to the owning user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
