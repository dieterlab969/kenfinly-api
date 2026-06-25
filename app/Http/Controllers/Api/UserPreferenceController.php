<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserPreferenceController extends Controller
{
    /**
     * Return the authenticated user's marketing preferences.
     * Creates a default record on first access.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $prefs = UserPreference::firstOrCreate(
            ['user_id' => $user->id],
            UserPreference::defaults($user->id)
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'email_news'    => $prefs->email_news,
                'email_offers'  => $prefs->email_offers,
                'email_surveys' => $prefs->email_surveys,
                'updated_at'    => $prefs->updated_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Update the authenticated user's marketing preferences.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email_news'    => 'required|boolean',
            'email_offers'  => 'required|boolean',
            'email_surveys' => 'required|boolean',
        ]);

        $user = $request->user();

        $prefs = UserPreference::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Marketing preferences saved.',
            'data'    => [
                'email_news'    => $prefs->email_news,
                'email_offers'  => $prefs->email_offers,
                'email_surveys' => $prefs->email_surveys,
                'updated_at'    => $prefs->updated_at?->toIso8601String(),
            ],
        ]);
    }
}
