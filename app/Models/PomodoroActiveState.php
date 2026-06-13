<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PomodoroActiveState extends Model
{
    protected $primaryKey = 'user_id';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'client_timer_started_at',
        'duration_seconds',
        'is_paused',
        'remaining_seconds',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'client_timer_started_at' => 'datetime',
        'duration_seconds' => 'integer',
        'is_paused' => 'boolean',
        'remaining_seconds' => 'integer',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
