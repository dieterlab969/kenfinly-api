<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Translation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TranslationManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Translation::with('language');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('key', 'like', "%{$search}%")
                  ->orWhere('value', 'like', "%{$search}%");
            });
        }

        if ($request->has('language_id')) {
            $query->where('language_id', $request->language_id);
        }

        $perPage = $request->get('per_page', 15);
        $translations = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $translations
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'language_id' => 'required|exists:languages,id',
            'key' => 'required|string|max:255',
            'value' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $translation = Translation::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Translation created successfully',
            'data' => $translation->load('language')
        ], 201);
    }

    public function update(Request $request, string $id)
    {
        $translation = Translation::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'key' => 'sometimes|required|string|max:255',
            'value' => 'sometimes|required|string',
            'language_id' => 'sometimes|required|exists:languages,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $translation->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Translation updated successfully',
            'data' => $translation->fresh('language')
        ]);
    }

    public function destroy(string $id)
    {
        $translation = Translation::findOrFail($id);
        $translation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Translation deleted successfully'
        ]);
    }
}
