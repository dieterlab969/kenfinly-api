<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
     public function store(Request $request)
    {
        $validated = $request->validate([
            'analytics_consent' => 'required|boolean',
            'marketing_consent' => 'boolean'
        ]);

         $sessionId = $request->session()->getId() ?: Str::random(40);
        $consent = UserConsent::updateOrCreate(
            ['session_id' => $sessionId],
            [
                'analytics_consent' => $validated['analytics_consent'],
                'marketing_consent' => $validated['marketing_consent'] ?? false,
                'ip_address' => $request->ip(),
                'consented_at' => Carbon::now(),
                'expires_at' => Carbon::now()->addMonths(12)
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Your preferences have been saved',
            'data' => [
                'analytics_consent' => $consent->analytics_consent,
                'marketing_consent' => $consent->marketing_consent
            ]
        ]);
    }

    public function show(Request $request)
    {
        $sessionId = $request->session()->getId();
        if (!$sessionId) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_consent' => false,
                    'analytics_consent' => false,
                    'marketing_consent' => false
                ]
            ]);
        }

        $consent = UserConsent::where('session_id', $sessionId)->first();

        if (!$consent || $consent->isExpired()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_consent' => false,
                    'analytics_consent' => false,
                    'marketing_consent' => false
                ]
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_consent' => true,
                'analytics_consent' => $consent->analytics_consent,
                'marketing_consent' => $consent->marketing_consent
            ]
        ]);
    }
}
