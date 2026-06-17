<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayosPaymentOrder extends Model
{
    protected $fillable = [
        'user_id',
        'order_code',
        'plan',
        'amount',
        'status',
        'payos_response',
    ];

    protected $casts = [
        'order_code'     => 'integer',
        'amount'         => 'integer',
        'payos_response' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
