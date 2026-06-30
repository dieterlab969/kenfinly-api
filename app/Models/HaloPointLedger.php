<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HaloPointLedger extends Model
{
    protected $table = 'halo_point_ledger';

    protected $fillable = [
        'user_id',
        'transaction_type',
        'amount',
        'previous_hash',
        'current_hash',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
