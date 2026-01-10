<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LicenseManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\License::with('subscription');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('license_key', 'like', "%{$search}%")
                  ->orWhere('product_name', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->get('per_page', 15);
        $licenses = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $licenses
        ]);
    }

    public function store(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'license_key' => 'required|string|unique:licenses,license_key',
            'product_name' => 'required|string|max:255',
            'status' => 'required|in:active,expired,revoked',
            'expires_at' => 'nullable|date',
            'max_activations' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $license = \App\Models\License::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'License created successfully',
            'data' => $license
        ], 201);
    }

    public function show(string $id)
    {
        $license = \App\Models\License::with('subscription')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $license
        ]);
    }

    public function update(Request $request, string $id)
    {
        $license = \App\Models\License::findOrFail($id);

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'license_key' => 'sometimes|required|string|unique:licenses,license_key,' . $id,
            'product_name' => 'sometimes|required|string|max:255',
            'status' => 'sometimes|in:active,expired,revoked',
            'expires_at' => 'nullable|date',
            'max_activations' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $license->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'License updated successfully',
            'data' => $license->fresh('subscription')
        ]);
    }

    public function destroy(string $id)
    {
        $license = \App\Models\License::findOrFail($id);
        $license->delete();

        return response()->json([
            'success' => true,
            'message' => 'License deleted successfully'
        ]);
    }
}
