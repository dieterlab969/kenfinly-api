<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class BetaAccessController extends Controller
{
    /**
     * Show the beta access form.
     */
    public function show(): View
    {
        return view('beta-access');
    }

    /**
     * Process the beta access code.
     */
    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'access_code' => 'required|string'
        ]);

        $providedCode = $request->input('access_code');
        $correctCode = config('app.staging_access_code');

        if (!$correctCode || $providedCode !== $correctCode) {
            return back()->withErrors([
                'access_code' => 'Invalid access code. Please try again.'
            ])->withInput();
        }

        // Create secure cookie that expires in 30 days
        $cookieName = 'kenfinly_beta_unlocked';
        $cookieValue = hash('sha256', $correctCode);
        $cookie = Cookie::make(
            $cookieName, 
            $cookieValue, 
            60 * 24 * 30, // 30 days
            '/', 
            null, 
            config('session.secure', false), // Use secure flag based on config
            true, // HTTP only
            false, // Don't use raw format
            'strict' // SameSite policy
        );

        // Redirect to dashboard or intended URL
        $redirectTo = $request->session()->pull('url.intended', '/halo');
        
        return redirect($redirectTo)->cookie($cookie);
    }

    /**
     * Remove beta access (logout from beta).
     */
    public function logout(Request $request): RedirectResponse
    {
        $cookieName = 'kenfinly_beta_unlocked';
        $cookie = Cookie::forget($cookieName);
        
        return redirect()->route('beta-access')->cookie($cookie);
    }
}