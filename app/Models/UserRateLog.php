<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRateLog extends Model
{
    protected $fillable = [
        'user_id',
        'old_rate',
        'new_rate',
        'allowance_year',
        'review_window',
    ];

    protected $casts = [
        'old_rate' => 'integer',
        'new_rate' => 'integer',
        'allowance_year' => 'integer',
        'review_window' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
