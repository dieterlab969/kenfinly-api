<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model representing a user achievement.
 * 
 * @property int $id
 * @property int $user_id
 * @property int|null $habit_id
 * @property string $type
 * @property string $title
 * @property string|null $description
 * @property string $icon
 * @property \Illuminate\Support\Carbon|null $achieved_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class Achievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'habit_id',
        'type',
        'title',
        'description',
        'icon',
        'achieved_at',
    ];

    protected $casts = [
        'achieved_at' => 'datetime',
    ];

    /**
     * Get the user that owns the achievement.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the habit associated with the achievement, if any.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function habit(): BelongsTo
    {
        return $this->belongsTo(Habit::class);
    }

    /**
     * Check if the achievement has been unlocked.
     * 
     * @return bool
     */
    public function isUnlocked(): bool
    {
        return $this->achieved_at !== null;
    }
}
