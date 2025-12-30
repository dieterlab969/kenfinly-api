<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentGatewayAuditLog extends Model
{
    protected $fillable = [
        'payment_gateway_id',
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'description',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
    ];

    public function paymentGateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function logAction(
        string $action,
        User $user,
        PaymentGateway $gateway = null,
        string $description = '',
        array $oldValues = [],
        array $newValues = [],
        array $metadata = []
    ): self {
        return self::create([
            'payment_gateway_id' => $gateway?->id,
            'user_id' => $user->id,
            'action' => $action,
            'resource_type' => 'payment_gateway',
            'resource_id' => $gateway?->id,
            'description' => $description,
            'old_values' => $oldValues ?: null,
            'new_values' => $newValues ?: null,
            'metadata' => $metadata ?: null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
