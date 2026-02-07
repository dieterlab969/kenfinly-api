<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Controller for managing categories in the admin interface.
 *
 * Provides CRUD operations for categories including listing, creating,
 * viewing, updating, and deleting categories. Supports pagination and search functionality.
 */
class CategoryManagementController extends Controller
{
    /**
     * Get a paginated list of categories with optional search filtering.
     *
     * @param Request $request HTTP request containing optional search and pagination parameters.
     * @return \Illuminate\Http\JsonResponse JSON response with success status and paginated category data.
     */
    public function index(Request $request)
    {
        $query = \App\Models\Category::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $perPage = $request->get('per_page', 15);
        $categories = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Create a new category.
     *
     * Validates the request data and creates a new category record.
     *
     * @param Request $request HTTP request containing category data (name, icon, color).
     * @return \Illuminate\Http\JsonResponse JSON response with success status, message, and created category data, or validation errors.
     */
    public function store(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $category = \App\Models\Category::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'data' => $category
        ], 201);
    }

    /**
     * Get details of a specific category.
     *
     * @param string $id The ID of the category to retrieve.
     * @return \Illuminate\Http\JsonResponse JSON response with success status and category data.
     */
    public function show(string $id)
    {
        $category = \App\Models\Category::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * Update an existing category.
     *
     * Validates the request data and updates the specified category.
     *
     * @param Request $request HTTP request containing updated category data.
     * @param string $id The ID of the category to update.
     * @return \Illuminate\Http\JsonResponse JSON response with success status, message, and updated category data, or validation errors.
     */
    public function update(Request $request, string $id)
    {
        $category = \App\Models\Category::findOrFail($id);

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:categories,name,' . $id,
            'icon' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $category->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category
        ]);
    }

    /**
     * Delete a category.
     *
     * @param string $id The ID of the category to delete.
     * @return \Illuminate\Http\JsonResponse JSON response with success status and deletion confirmation message.
     */
    public function destroy(string $id)
    {
        $category = \App\Models\Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully'
        ]);
    }
}
