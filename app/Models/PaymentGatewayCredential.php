<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Services\EncryptionService;

class PaymentGatewayCredential extends Model
{
    protected $fillable = [
        'payment_gateway_id',
        'environment',
        'credential_key',
        'encrypted_value',
        'encryption_algorithm',
        'is_test',
        'verified',
        'verified_at',
        'last_used_at',
        'updated_by',
    ];

    protected $casts = [
        'is_test' => 'boolean',
        'verified' => 'boolean',
        'verified_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    protected $hidden = ['encrypted_value'];

    public function paymentGateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class);
    }

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function setCredentialValue(string $value): void
    {
        $this->encrypted_value = EncryptionService::encrypt($value);
        $this->encryption_algorithm = 'AES-256-CBC';
    }

    public function getCredentialValue(): string
    {
        return EncryptionService::decrypt($this->encrypted_value);
    }

    public function verify(): void
    {
        $this->update([
            'verified' => true,
            'verified_at' => now(),
        ]);
    }

    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}
