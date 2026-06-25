<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Manages the authenticated user's marketing communication preferences.
 *
 * Each user has exactly one {@see UserPreference} row. If the row does not yet
 * exist it is created automatically with safe defaults on the first GET request,
 * so callers never need a separate "initialise" step.
 *
 * Routes (both require `auth:api` + `halo.integrity` middleware):
 *   GET  /api/user/preferences/marketing
 *   PUT  /api/user/preferences/marketing
 *
 * @package App\Http\Controllers\Api
 */
class UserPreferenceController extends Controller
{
    /**
     * Return the authenticated user's marketing preferences.
     *
     * If no preference row exists yet, one is created with the application
     * defaults ({@see UserPreference::defaults()}) before the response is
     * returned. This guarantees the frontend always receives a fully-populated
     * object without a separate setup call.
     *
     * @param  Request      $request  The current HTTP request (user resolved via JWT).
     * @return JsonResponse           200 JSON with keys:
     *                                  - success      bool
     *                                  - data.email_news    bool
     *                                  - data.email_offers  bool
     *                                  - data.email_surveys bool
     *                                  - data.updated_at    string|null (ISO 8601)
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
     *
     * All three toggle fields are required in every request so that a single
     * PUT always represents the full desired state, avoiding partial-update
     * ambiguity. The preference row is upserted, so this method is safe to
     * call even when no row exists yet.
     *
     * @param  Request      $request  The current HTTP request. Expected body (JSON):
     *                                  - email_news    bool  required
     *                                  - email_offers  bool  required
     *                                  - email_surveys bool  required
     * @return JsonResponse           200 on success with the persisted values, or
     *                                422 if any field fails validation.
     *
     * @throws \Illuminate\Validation\ValidationException  When a required field is
     *                                                      missing or not a boolean.
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
