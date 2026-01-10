<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Represents a payment gateway configuration in the system.
 *
 * This model manages the details and status of payment gateways available for processing payments.
 * It includes activation state, environment, metadata, and audit tracking relationships.
 */
class PaymentGateway extends Model
{
    /**
     * Attributes that are mass assignable.
     *
     * @var array<int,string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_active',
        'environment',
        'metadata',
        'created_by',
        'updated_by',
        'activated_at',
        'deactivated_at',
    ];

    /**
     * Attribute casting for proper data types.
     *
     * @var array<string,string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
        'activated_at' => 'datetime',
        'deactivated_at' => 'datetime',
    ];

    /**
     * Get the credentials associated with this payment gateway.
     *
     * @return HasMany Relationship to PaymentGatewayCredential
     */
    public function credentials(): HasMany
    {
        return $this->hasMany(PaymentGatewayCredential::class);
    }

    /**
     * Get the audit logs related to this payment gateway.
     *
     * @return HasMany Relationship to PaymentGatewayAuditLog
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(PaymentGatewayAuditLog::class);
    }

    /**
     * Get the user who created this payment gateway record.
     *
     * @return BelongsTo Relationship to User model
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this payment gateway record.
     *
     * @return BelongsTo Relationship to User model
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Activate the payment gateway.
     *
     * Sets the gateway as active, records the activation timestamp,
     * and clears any deactivation timestamp.
     *
     * @return void
     */
    public function activate(): void
    {
        $this->update([
            'is_active' => true,
            'activated_at' => now(),
            'deactivated_at' => null,
        ]);
    }

    /**
     * Deactivate the payment gateway.
     *
     * Sets the gateway as inactive, records the deactivation timestamp,
     * and clears any activation timestamp.
     *
     * @return void
     */
    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'deactivated_at' => now(),
            'activated_at' => null,
        ]);
    }

    /**
     * Toggle the activation state of the payment gateway.
     *
     * If currently active, deactivate it; otherwise, activate it.
     *
     * @return void
     */
    public function toggle(): void
    {
        if ($this->is_active) {
            $this->deactivate();
        } else {
            $this->activate();
        }
    }
}
