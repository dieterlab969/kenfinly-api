<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AccountController extends Controller
{
    public function index()
    {
        $user = auth('api')->user();
        
        $accounts = Account::where('user_id', $user->id)
            ->withCount('transactions')
            ->get();

        return response()->json([
            'success' => true,
            'accounts' => $accounts
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'balance' => 'required|numeric',
            'currency' => 'nullable|string|max:3',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth('api')->user();

        $account = Account::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'balance' => $request->balance ?? 0,
            'currency' => $request->currency ?? 'USD',
            'icon' => $request->icon,
            'color' => $request->color,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'account' => $account
        ], 201);
    }

    public function show($id)
    {
        $user = auth('api')->user();
        
        $account = Account::where('id', $id)
            ->where('user_id', $user->id)
            ->withCount('transactions')
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'account' => $account
        ]);
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'balance' => 'sometimes|required|numeric',
            'currency' => 'nullable|string|max:3',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:7',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth('api')->user();
        
        $account = Account::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $account->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Account updated successfully',
            'account' => $account
        ]);
    }

    public function destroy($id)
    {
        $user = auth('api')->user();
        
        $account = Account::where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($account->transactions()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete account with existing transactions'
            ], 400);
        }

        $account->delete();

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully'
        ]);
    }
}
