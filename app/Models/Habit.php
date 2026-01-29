<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

/**
 * Model representing a saving habit.
 * 
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property float $amount
 * @property int $frequency
 * @property string $color
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property-read int $current_streak
 * @property-read float $total_saved
 */
class Habit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'amount',
        'frequency',
        'color',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'frequency' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = ['current_streak', 'total_saved'];

    /**
     * Get the user that owns the habit.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the tracking records for the habit.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function trackings(): HasMany
    {
        return $this->hasMany(HabitTracking::class);
    }

    /**
     * Get the achievements associated with the habit.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function achievements(): HasMany
    {
        return $this->hasMany(Achievement::class);
    }

    /**
     * Accessor for the current streak attribute.
     * 
     * @return int
     */
    public function getCurrentStreakAttribute(): int
    {
        $trackings = $this->trackings()
            ->where('completed', true)
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->toArray();

        if (empty($trackings)) {
            return 0;
        }

        $streak = 0;
        $currentDate = Carbon::now()->startOfDay();

        foreach ($trackings as $date) {
            $trackingDate = Carbon::parse($date)->startOfDay();
            $expectedDate = $currentDate->copy()->subDays($streak);
            
            if ($trackingDate->equalTo($expectedDate) || 
                ($streak === 0 && $trackingDate->equalTo($expectedDate->subDay()))) {
                $streak++;
            } else {
                break;
            }
        }

        return $streak;
    }

    /**
     * Accessor for the total saved attribute.
     * 
     * @return float
     */
    public function getTotalSavedAttribute(): float
    {
        $completedCount = $this->trackings()->where('completed', true)->count();
        return $completedCount * floatval($this->amount);
    }
}
