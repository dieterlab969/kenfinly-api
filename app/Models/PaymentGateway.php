<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentGateway extends Model
{
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

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
        'activated_at' => 'datetime',
        'deactivated_at' => 'datetime',
    ];

    public function credentials(): HasMany
    {
        return $this->hasMany(PaymentGatewayCredential::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(PaymentGatewayAuditLog::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function activate(): void
    {
        $this->update([
            'is_active' => true,
            'activated_at' => now(),
            'deactivated_at' => null,
        ]);
    }

    public function deactivate(): void
    {
        $this->update([
            'is_active' => false,
            'deactivated_at' => now(),
            'activated_at' => null,
        ]);
    }

    public function toggle(): void
    {
        if ($this->is_active) {
            $this->deactivate();
        } else {
            $this->activate();
        }
    }
}
