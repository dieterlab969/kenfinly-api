<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\PaymentGateway;
use App\Models\PaymentGatewayCredential;
use Illuminate\Support\Facades\Log;
use Exception;

class PaymentProcessingService
{
    private EncryptionService $encryptionService;

    public function __construct()
    {
        $this->encryptionService = new EncryptionService();
    }

    /**
     * Process a payment for a subscription
     */
    public function processPayment(
        Subscription $subscription,
        PaymentGateway $gateway,
        array $paymentData
    ): Payment {
        try {
            // Validate subscription and gateway
            if (!$subscription->exists || !$gateway->is_active) {
                throw new Exception('Invalid subscription or inactive gateway');
            }

            // Create payment record
            $payment = Payment::create([
                'user_id' => $subscription->user_id,
                'subscription_id' => $subscription->id,
                'payment_gateway_id' => $gateway->id,
                'amount' => $subscription->amount,
                'currency' => $subscription->currency,
                'status' => 'pending',
                'payment_method' => $paymentData['payment_method'] ?? null,
                'metadata' => [
                    'plan' => $subscription->plan->name,
                    'user_ip' => $paymentData['user_ip'] ?? null,
                    'user_agent' => $paymentData['user_agent'] ?? null,
                ],
            ]);

            // Get gateway credentials
            $credentials = $this->getGatewayCredentials($gateway, $subscription);
            if (!$credentials) {
                throw new Exception('No credentials found for gateway');
            }

            // Process payment based on gateway type
            $gatewayResponse = $this->processWithGateway(
                $gateway,
                $credentials,
                $subscription,
                $payment,
                $paymentData
            );

            // Update payment with response
            $payment->update([
                'gateway_transaction_id' => $gatewayResponse['transaction_id'] ?? null,
                'gateway_response' => json_encode($gatewayResponse),
                'status' => $gatewayResponse['status'] ?? 'failed',
                'completed_at' => $gatewayResponse['status'] === 'completed' ? now() : null,
                'failed_at' => $gatewayResponse['status'] === 'failed' ? now() : null,
                'failure_reason' => $gatewayResponse['error'] ?? null,
            ]);

            // Update subscription status
            if ($gatewayResponse['status'] === 'completed') {
                $subscription->update([
                    'status' => 'active',
                    'start_date' => now(),
                    'end_date' => now()->addMonth(),
                ]);
            } else {
                $subscription->update(['status' => 'failed']);
            }

            Log::info('Payment processed', [
                'payment_id' => $payment->id,
                'status' => $payment->status,
                'gateway' => $gateway->name,
            ]);

            return $payment;
        } catch (Exception $e) {
            Log::error('Payment processing failed', [
                'subscription_id' => $subscription->id,
                'gateway' => $gateway->name ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get gateway credentials for processing
     */
    private function getGatewayCredentials(PaymentGateway $gateway, Subscription $subscription): ?array
    {
        $credentials = $gateway->credentials()
            ->where('environment', env('PAYMENT_ENVIRONMENT', 'production'))
            ->where('verified', true)
            ->get()
            ->mapWithKeys(fn($cred) => [
                $cred->credential_key => $cred->getCredentialValue()
            ])
            ->toArray();

        return !empty($credentials) ? $credentials : null;
    }

    /**
     * Process payment with specific gateway
     */
    private function processWithGateway(
        PaymentGateway $gateway,
        array $credentials,
        Subscription $subscription,
        Payment $payment,
        array $paymentData
    ): array {
        // Abstract payment processing - implement per gateway
        // This is a mock implementation for demonstration

        try {
            // Validate payment data
            if (empty($paymentData['amount']) || $paymentData['amount'] <= 0) {
                return [
                    'status' => 'failed',
                    'error' => 'Invalid amount',
                ];
            }

            // Simulate payment processing
            $transactionId = 'txn_' . uniqid();

            // Mock gateway response
            $success = true;
            if ($success) {
                return [
                    'status' => 'completed',
                    'transaction_id' => $transactionId,
                    'amount' => $paymentData['amount'],
                    'gateway' => $gateway->slug,
                    'timestamp' => now()->toIso8601String(),
                ];
            } else {
                return [
                    'status' => 'failed',
                    'error' => 'Payment declined by gateway',
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 'failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Retry failed payment
     */
    public function retryPayment(Payment $payment, array $paymentData): Payment
    {
        if (!$payment->isFailed()) {
            throw new Exception('Only failed payments can be retried');
        }

        $subscription = $payment->subscription;
        $gateway = $payment->gateway;

        return $this->processPayment($subscription, $gateway, $paymentData);
    }

    /**
     * Verify payment with gateway
     */
    public function verifyPayment(Payment $payment): bool
    {
        if (!$payment->gateway_transaction_id) {
            return false;
        }

        try {
            $credentials = $this->getGatewayCredentials(
                $payment->gateway,
                $payment->subscription
            );

            if (!$credentials) {
                return false;
            }

            // Mock verification
            $isVerified = true;

            if ($isVerified) {
                $payment->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

                if ($payment->subscription) {
                    $payment->subscription->update(['status' => 'active']);
                }
            }

            return $isVerified;
        } catch (Exception $e) {
            Log::error('Payment verification failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
