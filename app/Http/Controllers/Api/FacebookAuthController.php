<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

/**
 * Facebook One-Click OAuth — stateless JWT flow.
 *
 * Flow
 * ────
 * 1. Frontend opens  GET /api/v1/auth/facebook/redirect  (full-page redirect).
 * 2. Laravel redirects the browser to Facebook's OAuth dialog.
 * 3. Facebook redirects back to  GET /api/v1/auth/facebook/callback  with a code.
 * 4. This controller exchanges the code for a Facebook user profile.
 * 5a. Email already exists → silently link facebook_id if not set, log user in,
 *     issue JWT.
 * 5b. Email is new → JIT-register: random password, owner role, Free plan,
 *     email marked verified, JWT issued.
 * 6. Controller redirects browser to  /auth/facebook/success?token=<JWT>
 *    so the React SPA can capture it from the URL without it appearing in a
 *    JSON response body.
 *
 * Security notes
 * ──────────────
 * • stateless() mode is used — no session required on the API prefix.
 * • The JWT travels as a URL query parameter only for the redirect step.
 *   FacebookAuthSuccess.tsx immediately moves it to localStorage and calls
 *   window.history.replaceState to strip it from the browser history.
 * • /auth/facebook/success is whitelisted in CheckBetaAccess middleware so the
 *   token-capture page is always reachable, even in staging environments where
 *   users have not yet entered the beta-access code.
 * • No conflicts with GoogleAuthController — both use separate Socialite drivers
 *   and separate callback URLs; the User lookup path (by email) is identical.
 */
class FacebookAuthController extends Controller
{
    /**
     * Redirect the browser to Facebook's OAuth dialog.
     *
     * Called by the frontend when the user clicks "Continue with Facebook".
     * Returns a plain 302 redirect — not a JSON response.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('facebook')
            ->stateless()
            ->redirect();
    }

    /**
     * Handle the OAuth callback from Facebook and issue a JWT.
     *
     * Called by Facebook's servers (via the user's browser) after the user
     * approves (or denies) the OAuth dialog. Exchanges the authorization code
     * for a Facebook user profile, then finds or creates a local user.
     */
    public function callback(Request $request): RedirectResponse
    {
        // ── Handle user-cancelled authorization ──────────────────────────
        if ($request->has('error') || $request->has('error_reason')) {
            $reason = $request->input('error_reason', 'user_denied');

            Log::info('Facebook OAuth: user cancelled authorization', [
                'reason' => $reason,
                'ip'     => $request->ip(),
            ]);

            return redirect(config('app.url') . '/auth/facebook/error?reason=' . urlencode($reason));
        }

        // ── Exchange code for Facebook user profile ───────────────────────
        try {
            $fbUser = Socialite::driver('facebook')->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Facebook OAuth callback failed — Socialite error', [
                'error' => $e->getMessage(),
                'ip'    => $request->ip(),
            ]);

            return redirect(config('app.url') . '/auth/facebook/error?reason=oauth_failed');
        }

        $email      = $fbUser->getEmail();
        $facebookId = $fbUser->getId();

        // Facebook can withhold email when the user has not confirmed it or
        // uses a phone-only account. We cannot create/link without an email.
        if (empty($email)) {
            Log::warning('Facebook OAuth: no email returned by Facebook', [
                'facebook_id' => $facebookId,
            ]);

            return redirect(config('app.url') . '/auth/facebook/error?reason=no_email');
        }

        // ── Find or JIT-create the user ───────────────────────────────────
        $user = User::where('email', $email)->first();

        if ($user) {
            // Existing user — silently link facebook_id if not already set.
            $updates = [];

            if (empty($user->facebook_id)) {
                $updates['facebook_id'] = $facebookId;
            }

            if (empty($user->avatar) && $fbUser->getAvatar()) {
                $updates['avatar'] = $fbUser->getAvatar();
            }

            if (! empty($updates)) {
                $user->update($updates);
            }

            Log::info('Facebook OAuth: existing user logged in', [
                'user_id'    => $user->id,
                'email'      => $email,
                'fb_linked'  => isset($updates['facebook_id']),
            ]);
        } else {
            // JIT registration — create account with verified email.
            $user = $this->createUserFromFacebook($fbUser, $email, $facebookId);

            Log::info('Facebook OAuth: new user registered via Facebook', [
                'user_id' => $user->id,
                'email'   => $email,
            ]);
        }

        // ── Issue JWT and hand off to the SPA ────────────────────────────
        $token = auth('api')->login($user);

        $frontendUrl = rtrim(config('app.url'), '/');

        return redirect("{$frontendUrl}/auth/facebook/success?token=" . urlencode($token));
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * JIT-register a brand-new user from their Facebook profile.
     *
     * The account is immediately active and email-verified — Facebook has
     * already proved ownership of the email address. A cryptographically
     * random 32-character password is set so the account can never be
     * brute-forced via the regular login form.
     */
    private function createUserFromFacebook(
        mixed  $fbUser,
        string $email,
        string $facebookId,
    ): User {
        $user = User::create([
            'name'        => $fbUser->getName() ?: explode('@', $email)[0],
            'email'       => $email,
            'password'    => bcrypt(Str::random(32)),
            'facebook_id' => $facebookId,
            'status'      => 'active',
            'avatar'      => $fbUser->getAvatar(),
            'currency'    => 'VND',
        ]);

        // Mark email verified — Facebook already proved ownership.
        $user->markEmailAsVerified();

        // Assign owner role (same as regular registration).
        $user->assignRole('owner');

        // Enroll in Free plan if one exists.
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
