<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Language;
use App\Models\Translation;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();
        $locale = $request->header('Accept-Language', 'en');
        $language = Language::where('code', $locale)->first() ?? Language::where('code', 'en')->first();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $query->with(['children' => function($q) use ($language) {
            // We can't easily translate in the query without custom logic or joins
        }]);
        $query->whereNull('parent_id');

        $categories = $query->get()->map(function($category) use ($language) {
            return $this->translateCategory($category, $language);
        });

        return response()->json([
            'success' => true,
            'categories' => $categories
        ]);
    }

    private function translateCategory($category, $language)
    {
        $translation = Translation::where('language_id', $language->id)
            ->where('key', "categories.{$category->slug}")
            ->first();
        
        if ($translation) {
            $category->name = $translation->value;
        }

        if ($category->relationLoaded('children')) {
            $category->setRelation('children', $category->children->map(function($child) use ($language) {
                return $this->translateCategory($child, $language);
            }));
        }

        return $category;
    }
}
