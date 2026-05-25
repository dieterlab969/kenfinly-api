<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commitment extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'goal_amount',
        'current_amount',
        'image_path',
        'deadline',
        'status',
        'completed_at',
        'killed_at',
        'kill_reason',
    ];

    protected $casts = [
        'goal_amount' => 'integer',
        'current_amount' => 'integer',
        'deadline' => 'datetime',
        'completed_at' => 'datetime',
        'killed_at' => 'datetime',
        'title' => 'encrypted',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}
