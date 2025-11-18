<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LanguageManagementController extends Controller
{
    protected $protectedLanguages = ['en', 'vi'];

    public function index(Request $request)
    {
        $query = \App\Models\Language::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        $languages = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $languages
        ]);
    }

    public function store(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'code' => 'required|string|max:10|unique:languages,code',
            'name' => 'required|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $language = \App\Models\Language::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Language created successfully',
            'data' => $language
        ], 201);
    }

    public function show(string $id)
    {
        $language = \App\Models\Language::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $language
        ]);
    }

    public function update(Request $request, string $id)
    {
        $language = \App\Models\Language::findOrFail($id);

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'code' => 'sometimes|required|string|max:10|unique:languages,code,' . $id,
            'name' => 'sometimes|required|string|max:100',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $language->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Language updated successfully',
            'data' => $language
        ]);
    }

    public function destroy(string $id)
    {
        $language = \App\Models\Language::findOrFail($id);

        if (in_array($language->code, $this->protectedLanguages)) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete protected languages (English and Vietnamese)'
            ], 403);
        }

        $language->delete();

        return response()->json([
            'success' => true,
            'message' => 'Language deleted successfully'
        ]);
    }
}
