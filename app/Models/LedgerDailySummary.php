<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LedgerDailySummary extends Model
{
    protected $fillable = [
        'user_id',
        'ledger_type',
        'summary_date',
        'income_minor',
        'expense_minor',
        'net_minor',
        'transaction_count',
    ];

    protected $casts = [
        'summary_date' => 'date',
        'income_minor' => 'integer',
        'expense_minor' => 'integer',
        'net_minor' => 'integer',
        'transaction_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
