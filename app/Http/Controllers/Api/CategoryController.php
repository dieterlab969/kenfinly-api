<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Language;
use App\Models\Translation;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of the categories.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = Category::query();
        
        // Get locale from request header or default to English
        $locale = $request->header('Accept-Language', 'en');
        $language = Language::where('code', $locale)->first() ?: Language::where('code', 'en')->first();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Only get top-level categories, children will be loaded recursively
        $query->whereNull('parent_id')->with('children');

        $categories = $query->get()->map(function($category) use ($language) {
            return $this->translateCategory($category, $language);
        });

        return response()->json([
            'success' => true,
            'categories' => $categories
        ], 200);
    }

    /**
     * Recursively translate a category and its children.
     *
     * @param  \App\Models\Category  $category
     * @param  \App\Models\Language  $language
     * @return \App\Models\Category
     */
    private function translateCategory($category, $language)
    {
        if ($language) {
            $translation = Translation::where('language_id', $language->id)
                ->where('key', "categories.{$category->slug}")
                ->first();
            
            if ($translation) {
                $category->name = $translation->value;
            }
        }

        if ($category->relationLoaded('children')) {
            $category->setRelation('children', $category->children->map(function($child) use ($language) {
                return $this->translateCategory($child, $language);
            }));
        }

        return $category;
    }
}
