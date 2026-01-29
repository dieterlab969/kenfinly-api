<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model representing a single tracking entry for a habit.
 * 
 * @property int $id
 * @property int $habit_id
 * @property \Illuminate\Support\Carbon $date
 * @property bool $completed
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
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

    /**
     * Get the habit associated with the tracking entry.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }
}
