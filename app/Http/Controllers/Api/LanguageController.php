<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Language;
use App\Models\Translation;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    public function index()
    {
        $languages = Language::getActive();
        
        return response()->json([
            'success' => true,
            'languages' => $languages
        ]);
    }

    public function getTranslations($languageCode)
    {
        $language = Language::where('code', $languageCode)
            ->where('is_active', true)
            ->first();

        if (!$language) {
            $language = Language::getDefault();
        }

        $translations = Translation::where('language_id', $language->id)
            ->pluck('value', 'key');

        return response()->json([
            'success' => true,
            'language' => $language,
            'translations' => $translations
        ]);
    }

    public function updateUserLanguage(Request $request)
    {
        $user = auth('api')->user();
        
        $request->validate([
            'language_id' => 'required|exists:languages,id'
        ]);

        $user->language_id = $request->language_id;
        $user->save();

        $language = Language::find($request->language_id);

        return response()->json([
            'success' => true,
            'message' => 'Language preference updated successfully',
            'language' => $language
        ]);
    }
}
