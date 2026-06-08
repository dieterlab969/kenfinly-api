<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class BetaAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Set environment to staging for testing
        Config::set('app.env', 'staging');
        Config::set('app.staging_access_code', 'test-beta-code-123');
    }

    /** @test */
    public function user_without_valid_cookie_is_redirected_to_beta_access()
    {
        $response = $this->get('/halo');
        
        $response->assertRedirect(route('beta-access'));
    }

    /** @test */
    public function user_with_valid_cookie_can_access_protected_pages()
    {
        $cookieValue = hash('sha256', 'test-beta-code-123');
        
        $response = $this->withCookie('kenfinly_beta_unlocked', $cookieValue)
                        ->get('/halo');
        
        $response->assertSuccessful();
    }

    /** @test */
    public function invalid_cookie_is_rejected()
    {
        $response = $this->withCookie('kenfinly_beta_unlocked', 'invalid-hash')
                        ->get('/halo');
        
        $response->assertRedirect(route('beta-access'));
    }

    /** @test */
    public function health_endpoint_bypasses_beta_access_protection()
    {
        $response = $this->get('/health');
        
        $response->assertSuccessful()
                ->assertJson([
                    'status' => 'ok',
                    'environment' => 'staging'
                ]);
    }

    /** @test */
    public function api_status_endpoint_bypasses_beta_access_protection()
    {
        $response = $this->get('/api/status');
        
        // Assuming a basic status endpoint exists or will be created
        $response->assertSuccessful();
    }

    /** @test */
    public function api_routes_bypass_middleware_as_expected()
    {
        $response = $this->get('/api/test-endpoint');
        
        // Should not be redirected regardless of beta access
        $this->assertNotEquals(302, $response->getStatusCode());
    }

    /** @test */
    public function correct_access_code_creates_unlock_cookie_and_redirects()
    {
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'test-beta-code-123'
        ]);
        
        $response->assertRedirect('/halo')
                ->assertCookie('kenfinly_beta_unlocked', hash('sha256', 'test-beta-code-123'));
    }

    /** @test */
    public function incorrect_access_code_is_rejected()
    {
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'wrong-code'
        ]);
        
        $response->assertRedirect()
                ->assertSessionHasErrors(['access_code'])
                ->assertNoCookie('kenfinly_beta_unlocked');
    }

    /** @test */
    public function no_redirect_loops_occur_under_any_access_scenario()
    {
        // Test 1: Access beta-access page without cookie should not redirect
        $response = $this->get('/beta-access');
        $response->assertSuccessful();

        // Test 2: POST to beta-access should not redirect to itself
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'wrong-code'
        ]);
        $response->assertRedirect(); // Should redirect back, not to beta-access
        $this->assertNotEquals(route('beta-access'), $response->headers->get('Location'));

        // Test 3: Valid cookie access should not cause loops
        $cookieValue = hash('sha256', 'test-beta-code-123');
        $response = $this->withCookie('kenfinly_beta_unlocked', $cookieValue)
                        ->get('/beta-access');
        $response->assertSuccessful(); // Should show form, not redirect
    }

    /** @test */
    public function intended_url_is_stored_and_redirected_to_after_authentication()
    {
        // First, try to access a protected page
        $response = $this->get('/halo?param=value');
        $response->assertRedirect(route('beta-access'));

        // Then provide correct access code
        $response = $this->post(route('beta-access.verify'), [
            'access_code' => 'test-beta-code-123'
        ]);

        // Should redirect to the originally intended URL
        $response->assertRedirect('/halo?param=value');
    }

    /** @test */
    public function middleware_is_bypassed_in_non_staging_environments()
    {
        Config::set('app.env', 'production');
        
        $response = $this->get('/halo');
        
        // Should not be redirected in production
        $response->assertSuccessful();
    }

    /** @test */
    public function middleware_allows_access_when_no_staging_code_is_configured()
    {
        Config::set('app.staging_access_code', '');
        
        $response = $this->get('/halo');
        
        $response->assertSuccessful();
    }

    /** @test */
    public function beta_access_logout_removes_cookie_and_redirects()
    {
        $cookieValue = hash('sha256', 'test-beta-code-123');
        
        $response = $this->withCookie('kenfinly_beta_unlocked', $cookieValue)
                        ->post(route('beta-access.logout'));
        
        $response->assertRedirect(route('beta-access'))
                ->assertCookie('kenfinly_beta_unlocked', '', -2628000); // Cookie should be expired
    }

    /** @test */
    public function whitelisted_paths_are_accessible_without_beta_access()
    {
        $whitelistedPaths = [
            '/health',
            '/sitemap.xml',
            '/robots.txt',
            '/favicon.ico'
        ];

        foreach ($whitelistedPaths as $path) {
            $response = $this->get($path);
            $this->assertNotEquals(302, $response->getStatusCode(), 
                "Path {$path} should not redirect to beta access");
        }
    }
}
