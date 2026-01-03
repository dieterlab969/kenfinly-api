<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Services\EncryptionService;

/**
 * Manages secure storage and retrieval of payment gateway credentials.
 *
 * Use this model to store sensitive authentication information required for
 * connecting to various payment processing services. Each credential record
 * typically belongs to a specific payment gateway and contains encrypted
 * API keys, tokens, or other secure values needed for payment operations.
 *
 * Class PaymentGatewayCredential
 */
class PaymentGatewayCredential extends Model
{
    /**
     * @var string[]
     */
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

    /**
     * @var string[]
     */
    protected $casts = [
        'is_test' => 'boolean',
        'verified' => 'boolean',
        'verified_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    /**
     * @var string[]
     */
    protected $hidden = ['encrypted_value'];

    /**
     * Gets the payment gateway associated with this resource.
     *
     * @return BelongsTo Returns a belongs-to relationship to the PaymentGateway model.
     */
    public function paymentGateway(): BelongsTo
    {
        return $this->belongsTo(PaymentGateway::class);
    }

    /**
     * Gets the user who last updated this resource.
     *
     * Use this relationship when you need to access information about which user
     * performed the most recent update to this record. This creates a belongs-to
     * relationship that links this model to the User model through the 'updated_by'
     * foreign key column.
     *
     * This relationship is particularly useful for audit trails, activity logs,
     * and accountability tracking in your application. You can easily access
     * user details like:
     *
     * $resource->updatedByUser->name // Returns the name of the user who updated this resource
     *
     * @return BelongsTo Returns a belongs-to relationship to the User model.
     */
    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Sets and encrypts a credential value for secure storage.
     *
     * Use this method when you need to store sensitive credential information
     * in your application. The method handles the encryption process automatically,
     * converting the plain text value into an encrypted string using the
     * EncryptionService, then records which algorithm was used.
     *
     * @param string $value The plain text credential value to encrypt and store.
     * @return void This method doesn't return any value, it only updates properties.
     */
    public function setCredentialValue(string $value): void
    {
        $this->encrypted_value = EncryptionService::encrypt($value);
        $this->encryption_algorithm = 'AES-256-CBC';
    }

    /**
     * Retrieves the decrypted credential value from this resource.
     * Use this method when you need to access the actual credential value
     * for authentication or other sensitive operations. The method safely
     * decrypts the stored encrypted value using the EncryptionService.
     *
     * @return string
     */
    public function getCredentialValue(): string
    {
        return EncryptionService::decrypt($this->encrypted_value);
    }

    /**
     * Marks this resource as verified and records the verification timestamp.
     *
     * @return void This method updates the verification status without returning any value.
     */
    public function verify(): void
    {
        $this->update([
            'verified' => true,
            'verified_at' => now(),
        ]);
    }

    /**
     * Records the current usage timestamp for this resource.
     *
     * @return void This method doesn't return any value, it only updates the timestamp.
     */
    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}
