<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\Translation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Internationalisation — available languages and translations.
 *
 * @tags Languages & Translations
 */
class LanguageController extends Controller
{
    /**
     * List all active languages, sorted by display_order.
     *
     * PUBLIC endpoint — no authentication required.
     *
     * The query contract is enforced in Language::getActive():
     *   WHERE  is_active = true
     *   ORDER  display_order ASC, name ASC
     *
     * The frontend caches this response and falls back to it when the network
     * is unavailable, so the response must be stable and complete.
     *
     * GET /api/languages
     *
     * @return JsonResponse
     * @response 200 {
     *   "success": true,
     *   "languages": [
     *     { "id": 1, "code": "en-US", "name": "English (US)", "is_rtl": false, "display_order": 1 }
     *   ]
     * }
     */
    public function index(): JsonResponse
    {
        $languages = Language::getActive();

        return response()->json([
            'success'   => true,
            'languages' => $languages,
        ]);
    }

    /**
     * Return the translation key-value map for a given language code.
     *
     * Falls back to the default language when the requested code is not
     * active or does not exist.
     *
     * GET /api/languages/{code}/translations
     */
    public function getTranslations(string $languageCode): JsonResponse
    {
        $language = Language::where('code', $languageCode)
            ->where('is_active', true)
            ->first();

        if (! $language) {
            $language = Language::getDefault();
        }

        if (! $language) {
            return response()->json([
                'success'      => true,
                'language'     => null,
                'translations' => (object) [],
            ]);
        }

        $translations = Translation::where('language_id', $language->id)
            ->pluck('value', 'key');

        return response()->json([
            'success'      => true,
            'language'     => $language,
            'translations' => $translations,
        ]);
    }

    /**
     * Persist the authenticated user's language preference.
     *
     * POST /api/user/language  (requires auth:api)
     */
    public function updateUserLanguage(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $request->validate([
            'language_id' => 'required|exists:languages,id',
        ]);

        $user->language_id = $request->language_id;
        $user->save();

        $language = Language::find($request->language_id);

        return response()->json([
            'success'  => true,
            'message'  => 'Language preference updated successfully',
            'language' => $language,
        ]);
    }
}
