<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Subscription;
use App\Services\LicenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected $licenseService;

    public function __construct(LicenseService $licenseService)
    {
        $this->licenseService = $licenseService;
    }

    public function getPaymentInfo()
    {
        $user = auth()->user();
        
        $activeSubscription = Subscription::where('user_id', $user->id)
            ->where('status', 'active')
            ->where('end_date', '>', now())
            ->orderBy('end_date', 'desc')
            ->first();
        
        $paymentMethods = PaymentMethod::where('user_id', $user->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($method) {
                return [
                    'id' => $method->id,
                    'type' => $method->type,
                    'provider' => $method->provider,
                    'last_four' => $method->last_four,
                    'brand' => $method->brand,
                    'expiry_month' => $method->expiry_month,
                    'expiry_year' => $method->expiry_year,
                    'holder_name' => $method->holder_name,
                    'email' => $method->email,
                    'is_default' => $method->is_default,
                    'is_expired' => $method->isExpired(),
                    'display_name' => $method->display_name,
                ];
            });
        
        $upcomingPayment = null;
        if ($activeSubscription) {
            $upcomingPayment = [
                'date' => $activeSubscription->end_date->toDateString(),
                'amount' => $activeSubscription->amount,
                'currency' => $activeSubscription->currency,
                'plan' => $activeSubscription->plan_name,
            ];
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'upcoming_payment' => $upcomingPayment,
                'payment_methods' => $paymentMethods,
                'subscription' => $activeSubscription ? [
                    'id' => $activeSubscription->id,
                    'plan_name' => $activeSubscription->plan_name,
                    'amount' => $activeSubscription->amount,
                    'currency' => $activeSubscription->currency,
                    'status' => $activeSubscription->status,
                    'start_date' => $activeSubscription->start_date?->toDateString(),
                    'end_date' => $activeSubscription->end_date?->toDateString(),
                ] : null,
                'charge_description' => 'Charges will appear as "KENFINLY" on your statement.',
            ],
        ]);
    }

    public function getPaymentHistory(Request $request)
    {
        $user = auth()->user();
        $perPage = $request->get('per_page', 10);
        
        $payments = Payment::where('user_id', $user->id)
            ->with('subscription:id,plan_name')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $payments->items(),
            'pagination' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function getPaymentMethods()
    {
        $methods = PaymentMethod::where('user_id', auth()->id())
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();
        
        return response()->json([
            'success' => true,
            'data' => $methods,
        ]);
    }

    public function addPaymentMethod(Request $request)
    {
        $request->validate([
            'type' => 'required|in:credit_card,paypal',
            'last_four' => 'required_if:type,credit_card|string|size:4',
            'brand' => 'required_if:type,credit_card|string',
            'expiry_month' => 'required_if:type,credit_card|string|size:2',
            'expiry_year' => 'required_if:type,credit_card|string|size:4',
            'holder_name' => 'required_if:type,credit_card|string|max:255',
            'email' => 'required_if:type,paypal|email',
            'is_default' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            if ($request->is_default) {
                PaymentMethod::where('user_id', auth()->id())
                    ->update(['is_default' => false]);
            }
            
            $isFirstMethod = PaymentMethod::where('user_id', auth()->id())->count() === 0;
            
            $method = PaymentMethod::create([
                'user_id' => auth()->id(),
                'type' => $request->type,
                'provider' => $request->type === 'paypal' ? 'paypal' : 'stripe',
                'last_four' => $request->last_four,
                'brand' => $request->brand,
                'expiry_month' => $request->expiry_month,
                'expiry_year' => $request->expiry_year,
                'holder_name' => $request->holder_name,
                'email' => $request->email,
                'is_default' => $request->is_default || $isFirstMethod,
            ]);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Payment method added successfully',
                'data' => $method,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to add payment method',
            ], 500);
        }
    }

    public function updatePaymentMethod(Request $request, $id)
    {
        $method = PaymentMethod::where('user_id', auth()->id())
            ->findOrFail($id);
        
        $request->validate([
            'expiry_month' => 'sometimes|string|size:2',
            'expiry_year' => 'sometimes|string|size:4',
            'holder_name' => 'sometimes|string|max:255',
            'is_default' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            if ($request->is_default) {
                PaymentMethod::where('user_id', auth()->id())
                    ->where('id', '!=', $id)
                    ->update(['is_default' => false]);
            }
            
            $method->update($request->only([
                'expiry_month',
                'expiry_year',
                'holder_name',
                'is_default',
            ]));
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Payment method updated successfully',
                'data' => $method->fresh(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update payment method',
            ], 500);
        }
    }

    public function deletePaymentMethod($id)
    {
        $method = PaymentMethod::where('user_id', auth()->id())
            ->findOrFail($id);
        
        $wasDefault = $method->is_default;
        $method->delete();
        
        if ($wasDefault) {
            $nextMethod = PaymentMethod::where('user_id', auth()->id())
                ->orderBy('created_at', 'desc')
                ->first();
            if ($nextMethod) {
                $nextMethod->update(['is_default' => true]);
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Payment method deleted successfully',
        ]);
    }

    public function setDefaultPaymentMethod($id)
    {
        $method = PaymentMethod::where('user_id', auth()->id())
            ->findOrFail($id);
        
        PaymentMethod::where('user_id', auth()->id())
            ->update(['is_default' => false]);
        
        $method->update(['is_default' => true]);
        
        return response()->json([
            'success' => true,
            'message' => 'Default payment method updated',
            'data' => $method->fresh(),
        ]);
    }

    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'plan' => 'required|in:monthly,annual',
            'payment_method' => 'required|in:credit_card,paypal',
        ]);

        $amount = $request->plan === 'annual' ? 99.00 : 9.99;

        DB::beginTransaction();
        try {
            $subscription = Subscription::create([
                'user_id' => auth()->id(),
                'plan_name' => $request->plan,
                'amount' => $amount,
                'currency' => 'USD',
                'status' => 'pending',
            ]);

            $payment = Payment::create([
                'user_id' => auth()->id(),
                'subscription_id' => $subscription->id,
                'transaction_id' => 'TXN-' . uniqid(),
                'gateway' => $request->payment_method === 'paypal' ? 'paypal' : 'stripe',
                'amount' => $amount,
                'currency' => 'USD',
                'payment_method' => $request->payment_method,
                'status' => 'pending',
            ]);

            DB::commit();

            return response()->json([
                'payment_id' => $payment->id,
                'amount' => $amount,
                'currency' => 'USD',
                'message' => 'Payment intent created. Complete payment via gateway.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to create payment'], 500);
        }
    }

    public function webhook(Request $request)
    {
        $eventType = $request->input('type');

        if ($eventType === 'payment.completed') {
            $transactionId = $request->input('transaction_id');
            $payment = Payment::where('transaction_id', $transactionId)->first();

            if ($payment) {
                $payment->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

                $subscription = $payment->subscription;
                $subscription->update([
                    'status' => 'active',
                    'start_date' => now(),
                    'end_date' => now()->addYear(),
                ]);

                $this->licenseService->createLicense($payment->user, $subscription);
            }
        }

        return response()->json(['status' => 'received']);
    }

    public function myLicenses()
    {
        $licenses = auth()->user()->licenses()->with('subscription')->get();
        return response()->json($licenses);
    }
}
