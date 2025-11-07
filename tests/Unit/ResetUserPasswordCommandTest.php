<?php

namespace Tests\Unit;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetUserPasswordCommandTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful password reset.
     */
    public function test_password_reset_succeeds_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('oldpassword123'),
        ]);

        $this->artisan('user:reset-password', [
            '--email' => 'test@example.com',
            '--password' => 'newpassword123',
        ])
            ->expectsOutput('Password successfully reset for user: test@example.com')
            ->assertExitCode(0);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }

    /**
     * Test password reset fails when user does not exist.
     */
    public function test_password_reset_fails_when_user_not_found(): void
    {
        $this->artisan('user:reset-password', [
            '--email' => 'nonexistent@example.com',
            '--password' => 'newpassword123',
        ])
            ->expectsOutput("User with email 'nonexistent@example.com' not found.")
            ->assertExitCode(1);
    }

    /**
     * Test password reset fails when email option is missing.
     */
    public function test_password_reset_fails_when_email_is_missing(): void
    {
        $this->artisan('user:reset-password', [
            '--password' => 'newpassword123',
        ])
            ->expectsOutput('Both --email and --password options are required.')
            ->assertExitCode(1);
    }

    /**
     * Test password reset fails when password option is missing.
     */
    public function test_password_reset_fails_when_password_is_missing(): void
    {
        $this->artisan('user:reset-password', [
            '--email' => 'test@example.com',
        ])
            ->expectsOutput('Both --email and --password options are required.')
            ->assertExitCode(1);
    }

    /**
     * Test password reset fails with invalid email format.
     */
    public function test_password_reset_fails_with_invalid_email_format(): void
    {
        $this->artisan('user:reset-password', [
            '--email' => 'invalid-email',
            '--password' => 'newpassword123',
        ])
            ->expectsOutputToContain('The email field must be a valid email address')
            ->assertExitCode(1);
    }

    /**
     * Test password reset fails when password is too short.
     */
    public function test_password_reset_fails_when_password_is_too_short(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $this->artisan('user:reset-password', [
            '--email' => 'test@example.com',
            '--password' => 'short',
        ])
            ->expectsOutputToContain('The password field must be at least 8 characters')
            ->assertExitCode(1);
    }

    /**
     * Test password is properly hashed in database.
     */
    public function test_password_is_hashed_in_database(): void
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
        ]);

        $plainPassword = 'newpassword123';

        $this->artisan('user:reset-password', [
            '--email' => 'test@example.com',
            '--password' => $plainPassword,
        ])
            ->assertExitCode(0);

        $user->refresh();
        $this->assertNotEquals($plainPassword, $user->password);
        $this->assertTrue(Hash::check($plainPassword, $user->password));
    }

    /**
     * Test command displays user information after successful reset.
     */
    public function test_command_displays_user_information_after_reset(): void
    {
        $user = User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $this->artisan('user:reset-password', [
            '--email' => 'john@example.com',
            '--password' => 'newpassword123',
        ])
            ->expectsOutput('Password successfully reset for user: john@example.com')
            ->expectsOutput("User ID: {$user->id}")
            ->expectsOutput('Name: John Doe')
            ->assertExitCode(0);
    }
}
