<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
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
