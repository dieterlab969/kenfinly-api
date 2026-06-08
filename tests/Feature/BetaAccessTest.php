<?php

namespace Tests\Feature;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class BetaAccessTest extends TestCase
{
    /**
     * A simple protected route registered in routes/web.php (before the
     * catch-all) so it resolves correctly and returns 200 without any
     * database access. Only active when APP_ENV=testing.
     */
    private const PROTECTED_PATH = '/_test_protected';

    protected function setUp(): void
    {
        parent::setUp();

        // Exclude all paths from CSRF validation for this test suite.
        // These tests focus on the beta-access cookie/session flow, not CSRF.
        ValidateCsrfToken::except(['*']);

        // Activate the beta-access gate for all tests in this suite
        Config::set('app.env', 'staging');
        Config::set('app.staging_access_code', 'test-beta-code-123');
    }

    /** @test */
    public function user_without_valid_cookie_is_redirected_to_beta_access(): void
    {
        $response = $this->get(self::PROTECTED_PATH);

        $response->assertRedirect(route('beta-access'));
    }

    /** @test */
    public function user_with_valid_cookie_can_access_protected_pages(): void
    {
        $cookieValue = hash('sha256', 'test-beta-code-123');

        $response = $this->withCookie('kenfinly_beta_unlocked', $cookieValue)
            ->get(self::PROTECTED_PATH);

        $response->assertSuccessful();
    }

    /** @test */
    public function invalid_cookie_is_rejected(): void
    {
        $response = $this->withCookie('kenfinly_beta_unlocked', 'invalid-hash')
            ->get(self::PROTECTED_PATH);

        $response->assertRedirect(route('beta-access'));
    }

    /** @test */
    public function health_endpoint_bypasses_beta_access_protection(): void
    {
        $response = $this->get('/health');

        $response->assertSuccessful()
            ->assertJson([
                'status' => 'ok',
                'environment' => 'staging',
            ]);
    }

    /** @test */
    public function api_status_endpoint_bypasses_beta_access_protection(): void
    {
        $response = $this->get('/api/status');

        $response->assertSuccessful()
            ->assertJson(['status' => 'ok']);
    }

    /** @test */
    public function api_routes_bypass_middleware_as_expected(): void
    {
        // API routes are not under the web middleware group, so CheckBetaAccess
        // never runs for them. A 404 here is fine — what matters is no 302.
        $response = $this->get('/api/non-existent-endpoint');

        $this->assertNotEquals(302, $response->getStatusCode());
    }

    /** @test */
    public function correct_access_code_creates_unlock_cookie_and_redirects(): void
    {
        // First visit a protected page so the intended URL is stored in session
        $this->get(self::PROTECTED_PATH);

        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'test-beta-code-123',
        ]);

        $response->assertRedirect(self::PROTECTED_PATH)
            ->assertCookie('kenfinly_beta_unlocked', hash('sha256', 'test-beta-code-123'));
    }

    /** @test */
    public function incorrect_access_code_is_rejected(): void
    {
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'wrong-code',
        ]);

        $response->assertRedirect()
            ->assertSessionHasErrors(['access_code'])
            ->assertCookieMissing('kenfinly_beta_unlocked');
    }

    /** @test */
    public function no_redirect_loops_occur_under_any_access_scenario(): void
    {
        // 1. Accessing the gate page itself must not redirect
        $response = $this->get('/beta-access');
        $response->assertSuccessful();

        // 2. A failed POST redirects back to the form with validation errors —
        //    this is correct behaviour, not a loop (it requires user interaction
        //    to trigger another request; no automatic cycle occurs).
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'wrong-code',
        ]);
        $response->assertRedirect()
            ->assertSessionHasErrors(['access_code']);

        // 3. A valid cookie visiting the gate page shows the form, no redirect
        $cookieValue = hash('sha256', 'test-beta-code-123');
        $response = $this->withCookie('kenfinly_beta_unlocked', $cookieValue)
            ->get('/beta-access');
        $response->assertSuccessful();
    }

    /** @test */
    public function intended_url_is_stored_and_redirected_to_after_authentication(): void
    {
        // Visit a protected page — middleware stores the intended URL in session
        $this->get(self::PROTECTED_PATH . '?param=value')
            ->assertRedirect(route('beta-access'));

        // Provide the correct code — should bounce back to the intended URL
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'test-beta-code-123',
        ]);

        $response->assertRedirect(self::PROTECTED_PATH . '?param=value');
    }

    /** @test */
    public function middleware_is_bypassed_in_non_staging_environments(): void
    {
        Config::set('app.env', 'production');

        $response = $this->get(self::PROTECTED_PATH);

        // No redirect — middleware is inactive outside staging
        $response->assertSuccessful();
    }

    /** @test */
    public function middleware_allows_access_when_no_staging_code_is_configured(): void
    {
        Config::set('app.staging_access_code', '');

        $response = $this->get(self::PROTECTED_PATH);

        // Gate is disabled when no code is set, even in staging
        $response->assertSuccessful();
    }

    /** @test */
    public function beta_access_logout_removes_cookie_and_redirects(): void
    {
        $cookieValue = hash('sha256', 'test-beta-code-123');

        $response = $this->withCookie('kenfinly_beta_unlocked', $cookieValue)
            ->post(route('beta-access.logout'));

        $response->assertRedirect(route('beta-access'))
            ->assertCookieExpired('kenfinly_beta_unlocked');
    }

    /** @test */
    public function whitelisted_paths_are_accessible_without_beta_access(): void
    {
        $whitelistedPaths = [
            '/health',
            '/sitemap.xml',
            '/robots.txt',
            '/favicon.ico',
        ];

        foreach ($whitelistedPaths as $path) {
            $response = $this->get($path);
            $this->assertNotEquals(
                302,
                $response->getStatusCode(),
                "Path {$path} should not be redirected to beta-access"
            );
        }
    }
}
