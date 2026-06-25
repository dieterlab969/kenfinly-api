<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'email_news',
        'email_offers',
        'email_surveys',
    ];

    protected $casts = [
        'email_news'    => 'boolean',
        'email_offers'  => 'boolean',
        'email_surveys' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function defaults(int $userId): array
    {
        return [
            'user_id'       => $userId,
            'email_news'    => true,
            'email_offers'  => false,
            'email_surveys' => false,
        ];
    }
}
