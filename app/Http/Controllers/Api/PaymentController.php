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

class PaymentController extends Controller
{
    private PaymentProcessingService $paymentService;

    public function __construct()
    {
        $this->middleware('auth:api');
        $this->paymentService = new PaymentProcessingService();
    }

    /**
     * Process payment for a subscription
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

            // Verify user owns subscription
            if ($subscription->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
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
     * Get payment history
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
     * Get payment details
     */
    public function show(Payment $payment): JsonResponse
    {
        if ($payment->user_id !== auth()->id() && !auth()->user()->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($payment->load('subscription.plan', 'gateway', 'user'));
    }

    /**
     * Retry failed payment
     */
    public function retry(Payment $payment, Request $request): JsonResponse
    {
        try {
            if ($payment->user_id !== auth()->id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
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
