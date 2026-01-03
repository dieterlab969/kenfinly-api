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
     * Processes a payment for a given subscription using the specified payment gateway.
     *
     * This method validates the subscription and gateway status, creates a payment record,
     * retrieves the appropriate gateway credentials, and attempts to process the payment.
     * It updates the payment and subscription status based on the gateway response.
     *
     * Use this method to handle payment workflows end-to-end for subscription billing.
     *
     * @param Subscription $subscription The subscription to be billed.
     * @param PaymentGateway $gateway The payment gateway to process the payment.
     * @param array $paymentData Additional payment data such as payment method, user IP, and user agent.
     *
     * @return Payment Returns the Payment model instance representing the processed payment.
     *
     * @throws Exception Throws exceptions if subscription or gateway validation fails or processing errors occur.
     */
    public function processPayment(
        Subscription $subscription,
        PaymentGateway $gateway,
        array $paymentData
    ): Payment {
        try {
            if (!$subscription->exists || !$gateway->is_active) {
                throw new Exception('Invalid subscription or inactive gateway');
            }

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

            $credentials = $this->getGatewayCredentials($gateway, $subscription);

            if (!$credentials) {
                throw new Exception('No credentials found for gateway');
            }

            $gatewayResponse = $this->processWithGateway(
                $gateway,
                $credentials,
                $subscription,
                $payment,
                $paymentData
            );

            $payment->update([
                'gateway_transaction_id' => $gatewayResponse['transaction_id'] ?? null,
                'gateway_response' => json_encode($gatewayResponse),
                'status' => $gatewayResponse['status'] ?? 'failed',
                'completed_at' => $gatewayResponse['status'] === 'completed' ? now() : null,
                'failed_at' => $gatewayResponse['status'] === 'failed' ? now() : null,
                'failure_reason' => $gatewayResponse['error'] ?? null,
            ]);

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
     * Retrieves verified gateway credentials for the current environment.
     *
     * This method fetches credentials associated with the payment gateway that match
     * the application's environment (e.g., production, staging) and are marked as verified.
     * It returns an associative array mapping credential keys to their decrypted values.
     *
     * @param PaymentGateway $gateway The payment gateway whose credentials are requested.
     * @param Subscription $subscription The subscription context (unused here but available for extension).
     *
     * @return array|null Returns an associative array of credential keys and values, or null if none found.
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
     * Processes a payment through a specific payment gateway.
     *
     * This method contains the gateway-specific logic to execute a payment transaction.
     * It validates payment data, simulates processing, and returns a structured response.
     * Replace the mock implementation with real gateway API calls as needed.
     *
     * @param PaymentGateway $gateway The payment gateway to use.
     * @param array $credentials The decrypted credentials for authentication.
     * @param Subscription $subscription The subscription being billed.
     * @param Payment $payment The payment record being processed.
     * @param array $paymentData Additional payment details.
     *
     * @return array Returns an array with keys like 'status', 'transaction_id', 'error', etc.
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
     * Retries a previously failed payment.
     *
     * This method allows retrying payments that have failed by re-processing
     * the payment with the original subscription and gateway details.
     *
     * @param Payment $payment The failed payment to retry.
     * @param array $paymentData Additional payment data for retry.
     *
     * @return Payment Returns the new Payment instance after retry.
     *
     * @throws Exception Throws if the payment is not in a failed state.
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
     * Verifies a payment with the payment gateway.
     *
     * This method checks the payment status with the gateway using stored credentials.
     * If verification succeeds, it updates the payment and subscription status accordingly.
     *
     * @param Payment $payment The payment to verify.
     *
     * @return bool Returns true if verification is successful, false otherwise.
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
