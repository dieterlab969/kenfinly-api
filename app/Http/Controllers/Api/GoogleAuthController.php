<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

/**
 * Google One-Click OAuth — stateless JWT flow.
 *
 * Flow
 * ────
 * 1. Frontend opens  GET /api/v1/auth/google/redirect  in a popup/new tab.
 * 2. Laravel redirects the browser to Google's OAuth consent screen.
 * 3. Google redirects back to  GET /api/v1/auth/google/callback  with a code.
 * 4. This controller exchanges the code for a Google user profile.
 * 5a. Email already exists → log the user in, issue JWT.
 * 5b. Email is new → JIT-register with a secure random password, assign owner
 *     role + Free plan, mark email verified, issue JWT.
 * 6. Controller redirects the browser to  /auth/google/success?token=<JWT>
 *    so the React frontend can pick up the token from the URL fragment and
 *    store it in localStorage without exposing it in a JSON body to the popup.
 *
 * Security notes
 * ──────────────
 * • The JWT is passed as a URL query parameter only for the redirect step.
 *   React must immediately move it to localStorage and replace the URL.
 * • The redirect target (/auth/google/success) is a dedicated SPA route
 *   that does nothing but extract the token and close/redirect the popup.
 * • Socialite stateless() mode is used so no session is needed on the API.
 */
class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to Google's OAuth consent screen.
     *
     * Called by the frontend when the user clicks "Continue with Google".
     * Returns a plain redirect — not a JSON response.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle the OAuth callback from Google and issue a JWT.
     *
     * This endpoint is called by Google's servers (via the user's browser),
     * not by the React SPA directly. It exchanges the authorization code for
     * a Google user profile, then finds or creates a local user.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback failed — Socialite error', [
                'error' => $e->getMessage(),
                'ip'    => $request->ip(),
            ]);

            return redirect(config('app.url') . '/auth/google/error?reason=oauth_failed');
        }

        $email = $googleUser->getEmail();

        if (empty($email)) {
            Log::warning('Google OAuth: no email returned by Google', [
                'google_id' => $googleUser->getId(),
            ]);

            return redirect(config('app.url') . '/auth/google/error?reason=no_email');
        }

        // ── Find or JIT-create the user ───────────────────────────────────
        $user = User::where('email', $email)->first();

        if ($user) {
            // Existing user — update Google avatar if not already set
            if (empty($user->avatar) && $googleUser->getAvatar()) {
                $user->update(['avatar' => $googleUser->getAvatar()]);
            }

            Log::info('Google OAuth: existing user logged in', [
                'user_id' => $user->id,
                'email'   => $email,
            ]);
        } else {
            // JIT registration — create account with verified email
            $user = $this->createUserFromGoogle($googleUser, $email);

            Log::info('Google OAuth: new user registered via Google', [
                'user_id' => $user->id,
                'email'   => $email,
            ]);
        }

        // ── Issue JWT ─────────────────────────────────────────────────────
        $token = auth('api')->login($user);

        // Redirect the browser to the SPA success handler with the token.
        // The React route /auth/google/success reads it, stores it, and
        // then navigates to /Home.
        $frontendUrl = rtrim(config('app.url'), '/');

        return redirect("{$frontendUrl}/auth/google/success?token=" . urlencode($token));
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * JIT-register a brand-new user from their Google profile.
     *
     * The account is immediately active and email-verified — Google has
     * already proved ownership of the email address. A cryptographically
     * random 32-character password is set so the account can never be
     * brute-forced via the regular login form.
     */
    private function createUserFromGoogle(mixed $googleUser, string $email): User
    {
        $user = User::create([
            'name'     => $googleUser->getName() ?: explode('@', $email)[0],
            'email'    => $email,
            'password' => bcrypt(Str::random(32)),
            'status'   => 'active',
            'avatar'   => $googleUser->getAvatar(),
            'currency' => 'VND',
        ]);

        // Mark the email verified — Google already proved ownership.
        $user->markEmailAsVerified();

        // Assign owner role (same as regular registration).
        $user->assignRole('owner');

        // Enroll in Free plan.
        $freePlan = SubscriptionPlan::where('name', 'Free')->first();
        if ($freePlan) {
            Subscription::create([
                'user_id'    => $user->id,
                'plan_id'    => $freePlan->id,
                'status'     => 'active',
                'amount'     => 0,
                'currency'   => 'VND',
                'start_date' => now(),
            ]);
        }

        return $user;
    }
}
