<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Waitlist;
use Illuminate\Http\Request;

class WaitlistController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:waitlists,email',
            'plan_interest' => 'nullable|string'
        ]);

        Waitlist::create($request->only(['email', 'plan_interest']));

        return response()->json(['message' => 'Successfully joined the waitlist!'], 201);
    }
}
