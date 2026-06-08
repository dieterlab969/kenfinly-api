<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class BetaAccessController extends Controller
{
    /**
     * Show the beta access gate view.
     */
    public function show(): View
    {
        return view('beta-access');
    }

    /**
     * Verify the beta access code and set secure cookie.
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => 'required|string',
        ], [
            'code.required' => 'Beta access code is required.',
        ]);

        $providedCode = $request->input('code');
        $correctCode = config('app.staging_access_code') ?? env('STAGING_ACCESS_CODE');

        if ($providedCode !== $correctCode) {
            return back()->withErrors(['code' => 'Invalid beta access code. Please try again.']);
        }

        // Set secure cookie (httpOnly, secure in production, sameSite)
        return redirect('/dashboard')
            ->cookie(
                'kenfinly_beta_unlocked',
                'true',
                60 * 24 * 30, // 30 days
                '/',
                null,
                true, // secure (HTTPS only in production)
                true, // httpOnly
                false,
                'Lax' // sameSite
            );
    }
}
