<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::with('user');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('currency', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->get('per_page', 15);
        $accounts = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $accounts
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'balance' => 'nullable|numeric|min:0',
            'currency' => 'required|string|max:3',
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

        $account = Account::create($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'data' => $account->load('user')
        ], 201);
    }

    public function show(string $id)
    {
        $account = Account::with(['user', 'transactions'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $account
        ]);
    }

    public function update(Request $request, string $id)
    {
        $account = Account::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'balance' => 'sometimes|numeric|min:0',
            'currency' => 'sometimes|required|string|max:3',
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

        $account->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'data' => $account->fresh('user')
        ]);
    }

    public function destroy(string $id)
    {
        $account = Account::findOrFail($id);
        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
    }
}
