<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserConsent;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ConsentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        if (!config('wordpress.cookie_consent.enabled')) {
            return response()->json([
                'success' => false,
                'message' => 'Cookie consent is currently disabled.',
            ], Response::HTTP_FORBIDDEN);
        }

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

    public function show(Request $request): JsonResponse
    {
        if (!config('wordpress.cookie_consent.enabled')) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_consent' => true, // Treat as consented if disabled to hide banner
                    'analytics_consent' => true,
                    'marketing_consent' => true,
                    'disabled' => true
                ]
            ]);
        }

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

    public function destroy(Request $request): JsonResponse
    {
        $sessionId = $request->session()->getId();

        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'No consent record found'
            ], Response::HTTP_NOT_FOUND);
        }

        $consent = UserConsent::where('session_id', $sessionId)->first();

        if (!$consent) {
            return response()->json([
                'success' => false,
                'message' => 'No consent record found'
            ], Response::HTTP_NOT_FOUND);
        }

        $deletedInfo = [
            'analytics_consent' => $consent->analytics_consent,
            'marketing_consent' => $consent->marketing_consent,
            'consented_at' => $consent->consented_at,
            'deleted_at' => Carbon::now()
        ];

        $consent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Your consent has been withdrawn successfully. All tracking has been disabled.',
            'data' => [
                'consent_withdrawn' => true,
                'deleted_at' => $deletedInfo['deleted_at']->toIso8601String()
            ]
        ]);
    }

    /**
     * Update existing consent preferences
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'analytics_consent' => 'required|boolean',
            'marketing_consent' => 'boolean'
        ]);

        $sessionId = $request->session()->getId();

        if (!$sessionId) {
            return response()->json([
                'success' => false,
                'message' => 'No active session found'
            ], Response::HTTP_BAD_REQUEST);
        }

        $consent = UserConsent::where('session_id', $sessionId)->first();

        if (!$consent) {
            return response()->json([
                'success' => false,
                'message' => 'No consent record found. Please provide consent first.'
            ], Response::HTTP_NOT_FOUND);
        }

        // Track if consent was changed
        $consentChanged = (
            $consent->analytics_consent !== $validated['analytics_consent'] ||
            $consent->marketing_consent !== ($validated['marketing_consent'] ?? false)
        );

        $consent->update([
            'analytics_consent' => $validated['analytics_consent'],
            'marketing_consent' => $validated['marketing_consent'] ?? false,
            'consented_at' => $consentChanged ? Carbon::now() : $consent->consented_at,
            'expires_at' => Carbon::now()->addMonths(12)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your preferences have been updated',
            'data' => [
                'analytics_consent' => $consent->analytics_consent,
                'marketing_consent' => $consent->marketing_consent,
                'updated_at' => $consent->updated_at->toIso8601String(),
                'expires_at' => $consent->expires_at->toIso8601String()
            ]
        ]);
    }
}
