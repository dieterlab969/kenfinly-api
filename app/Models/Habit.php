<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trackings(): HasMany
    {
        return $this->hasMany(HabitTracking::class);
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(Achievement::class);
    }

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

    public function getTotalSavedAttribute(): float
    {
        $completedCount = $this->trackings()->where('completed', true)->count();
        return $completedCount * floatval($this->amount);
    }
}
