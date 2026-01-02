<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\PaymentGateway;
use App\Services\PaymentProcessingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Controller responsible for handling payment-related API requests.
 *
 * This includes processing payments, retrieving payment history and details,
 * and retrying failed payments. Access is restricted to authenticated users.
 */
class PaymentController extends Controller
{
    private PaymentProcessingService $paymentService;

    /**
     * PaymentController constructor.
     * Applies authentication middleware and initializes the payment processing service.
     */
    public function __construct()
    {
        $this->middleware('auth:api');
        $this->paymentService = new PaymentProcessingService();
    }

    /**
     * Process a payment for a subscription.
     *
     * Validates the request data, verifies subscription ownership or admin role,
     * and delegates payment processing to the PaymentProcessingService.
     *
     * @param Request $request Incoming HTTP request containing payment data.
     * @return JsonResponse JSON response with payment status and details or error message.
     */
    public function processPayment(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'subscription_id' => 'required|exists:subscriptions,id',
                'payment_gateway_id' => 'required|exists:payment_gateways,id',
                'amount' => 'required|numeric|min:0.01',
                'payment_method' => 'nullable|string',
            ]);

            $subscription = Subscription::findOrFail($validated['subscription_id']);
            $gateway = PaymentGateway::findOrFail($validated['payment_gateway_id']);

            // Verify user owns subscription or has super admin role
            if ($subscription->user_id !== auth()->id() && !auth()->user()->hasRole('super_admin')) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $payment = $this->paymentService->processPayment(
                $subscription,
                $gateway,
                array_merge($validated, [
                    'user_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ])
            );

            return response()->json([
                'message' => 'Payment processed',
                'payment' => $payment,
                'status' => $payment->status,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Retrieve paginated payment history for the authenticated user.
     *
     * Loads related subscription plans and payment gateways for context.
     *
     * @param Request $request Incoming HTTP request.
     * @return JsonResponse JSON response containing paginated payment records.
     */
    public function history(Request $request): JsonResponse
    {
        $payments = Payment::where('user_id', auth()->id())
            ->with('subscription.plan', 'gateway')
            ->latest()
            ->paginate(15);

        return response()->json($payments);
    }

    /**
     * Retrieve details of a specific payment.
     *
     * Verifies ownership or admin role before returning payment data with related models.
     *
     * @param Payment $payment Payment model instance to show.
     * @return JsonResponse JSON response containing payment details or unauthorized message.
     */
    public function show(Payment $payment): JsonResponse
    {
        if ($payment->user_id !== auth()->id() && !auth()->user()->hasRole('super_admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payment->load('subscription.plan', 'gateway', 'user'));
    }

    /**
     * Retry a failed payment.
     *
     * Checks that the payment belongs to the authenticated user and that its status is 'failed'.
     * Validates optional payment method input and delegates retry logic to the PaymentProcessingService.
     *
     * @param Payment $payment Payment model instance to retry.
     * @param Request $request Incoming HTTP request with optional payment method.
     * @return JsonResponse JSON response with updated payment status or error message.
     */
    public function retry(Payment $payment, Request $request): JsonResponse
    {
        try {
            if ($payment->user_id !== auth()->id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Only allow retry if payment status is 'failed'
            if ($payment->status !== 'failed') {
                return response()->json(['message' => 'Only failed payments can be retried'], 400);
            }

            $validated = $request->validate([
                'payment_method' => 'nullable|string',
            ]);

            $payment = $this->paymentService->retryPayment($payment, [
                'amount' => $payment->amount,
                'payment_method' => $validated['payment_method'] ?? null,
                'user_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return response()->json([
                'message' => 'Payment retried',
                'payment' => $payment,
                'status' => $payment->status,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
