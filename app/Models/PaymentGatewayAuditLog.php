<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents an audit log entry for actions performed on payment gateways.
 *
 * This model tracks changes, actions, and metadata related to payment gateways,
 * including who performed the action and relevant context such as IP address and user agent.
 */
class PaymentGatewayAuditLog extends Model
{
    /**
     * Attributes that can be mass assigned.
     *
     * @var array<int,string>
     */
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

    /**
     * Attribute casting for proper data types.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Get the payment gateway associated with this audit log entry.
     *
     * @return BelongsTo Relationship to PaymentGateway model
     */
    public function paymentGateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class);
    }

    /**
     * Get the user who performed the action logged.
     *
     * @return BelongsTo Relationship to User model
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a new audit log entry for a payment gateway action.
     *
     * Use this method to record changes or actions performed on payment gateways.
     * It captures the user, action description, old and new values, metadata,
     * and request context such as IP address and user agent.
     *
     * @param string $action The action performed (e.g., 'update', 'activate', 'deactivate')
     * @param User $user The user who performed the action
     * @param PaymentGateway|null $gateway The payment gateway affected (optional)
     * @param string $description A textual description of the action
     * @param array $oldValues The previous state before the action (optional)
     * @param array $newValues The new state after the action (optional)
     * @param array $metadata Additional metadata related to the action (optional)
     *
     * @return self The created audit log instance
     */
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
