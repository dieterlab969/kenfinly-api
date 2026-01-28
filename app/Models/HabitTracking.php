<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HabitTracking extends Model
{
    use HasFactory;

    protected $fillable = [
        'habit_id',
        'date',
        'completed',
    ];

    protected $casts = [
        'date' => 'date',
        'completed' => 'boolean',
    ];

    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }
}
