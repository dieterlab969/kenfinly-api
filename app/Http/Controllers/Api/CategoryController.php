<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $query->with('children');
        $query->whereNull('parent_id');

        $categories = $query->get();

        return response()->json([
            'success' => true,
            'categories' => $categories
        ]);
    }
}
