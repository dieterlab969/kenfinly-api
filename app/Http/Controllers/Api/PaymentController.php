<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentProcessRequest;
use App\Http\Requests\RetryPaymentRequest;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\PaymentGateway;
use App\Services\PaymentProcessingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Payment processing, history, and payment method management.
 *
 * @tags Payments
 */
class PaymentController extends Controller
{
    /**
     * Service that handles the payment processing logic.
     *
     * @var PaymentProcessingService
     */
    private PaymentProcessingService $paymentService;

    /**
     * PaymentController constructor.
     *
     * Applies authentication middleware and initializes the payment processing service.
     * You must be authenticated to access any of the payment endpoints.
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
    public function processPayment(PaymentProcessRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $subscription = Subscription::findOrFail($validated['subscription_id']);
            $gateway = PaymentGateway::findOrFail($validated['payment_gateway_id']);

            $this->authorize('view', $subscription);

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
        $this->authorize('view', $payment);

        $payment = $payment->load('subscription.plan', 'gateway', 'user');
        return response()->json([
            'success' => true,
            'data' => $payment,
            'payment' => $payment,
        ]);
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
    public function retry(Payment $payment, RetryPaymentRequest $request): JsonResponse
    {
        try {
            $this->authorize('retry', $payment);

            // Only allow retry if payment status is 'failed'
            if ($payment->status !== 'failed') {
                return response()->json(['message' => 'Only failed payments can be retried'], 400);
            }

            $validated = $request->validated();

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
