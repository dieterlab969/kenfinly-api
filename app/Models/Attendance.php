<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'halo_date',
        'status',
        'started_at',
        'expected_end_at',
        'ended_at',
        'user_rating',
        'quote_text',
        'quote_vote',
        'earned_amount',
        'reward_transaction_id',
        'reminder_due_at',
        'reminder_sent_at',
        'kill_reason',
    ];

    protected $casts = [
        'halo_date' => 'date',
        'started_at' => 'datetime',
        'expected_end_at' => 'datetime',
        'ended_at' => 'datetime',
        'reminder_due_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
        'earned_amount' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rewardTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'reward_transaction_id');
    }
}
