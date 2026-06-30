<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Feature tests for POST /api/profile/avatar.
 *
 * Covers:
 *  - Auth guard (401 without token)
 *  - Successful upload, resize, and storage
 *  - Old avatar cleanup before new upload
 *  - Response shape: success, avatar_url, profile object
 *  - Validation failures: missing file, file too large, invalid MIME
 *  - Magic-byte rejection (non-image with renamed .jpg extension)
 *  - GET /api/profile reflects the new avatar URL after upload
 *  - Collision-resistant filename (UUID-based, stored under avatars/)
 */
class AvatarUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function makeUser(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'email_verified_at' => now(),
            'status'            => 'active',
        ], $overrides));
    }

    private function fakeImage(string $name = 'avatar.jpg', int $width = 800, int $height = 600): UploadedFile
    {
        return UploadedFile::fake()->image($name, $width, $height);
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    #[Test]
    public function unauthenticated_user_cannot_upload_avatar(): void
    {
        $this->postJson('/api/profile/avatar', [
            'avatar' => $this->fakeImage(),
        ])->assertUnauthorized();
    }

    // ── Successful upload ─────────────────────────────────────────────────────

    #[Test]
    public function authenticated_user_can_upload_a_valid_avatar(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ]);

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonStructure([
                'success',
                'message',
                'avatar_url',
                'profile' => [
                    'id', 'name', 'email', 'avatar',
                ],
            ]);
    }

    #[Test]
    public function upload_stores_file_in_the_avatars_directory(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        $user->refresh();
        $this->assertNotNull($user->avatar);
        $this->assertStringStartsWith('avatars/', $user->avatar);
        Storage::disk('public')->assertExists($user->avatar);
    }

    #[Test]
    public function uploaded_filename_is_uuid_based_and_has_jpg_extension(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        $user->refresh();
        $filename = basename($user->avatar);

        // UUID pattern: 8-4-4-4-12 hex chars
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/',
            $filename
        );
    }

    #[Test]
    public function avatar_url_in_response_points_to_the_stored_file(): void
    {
        $user = $this->makeUser();

        $response = $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        $avatarUrl = $response->json('avatar_url');
        $this->assertNotNull($avatarUrl);
        $this->assertStringContainsString('avatars/', $avatarUrl);
    }

    #[Test]
    public function upload_accepts_png_images(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('photo.png', 300, 300),
            ])
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    #[Test]
    public function upload_accepts_webp_images(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => UploadedFile::fake()->image('photo.webp', 300, 300),
            ])
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    // ── Old avatar cleanup ────────────────────────────────────────────────────

    #[Test]
    public function old_local_avatar_is_deleted_before_new_one_is_stored(): void
    {
        $user = $this->makeUser();

        $oldPath = 'avatars/old-avatar.jpg';
        Storage::disk('public')->put($oldPath, 'fake-image-content');
        $user->update(['avatar' => $oldPath]);

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        Storage::disk('public')->assertMissing($oldPath);
        $user->refresh();
        Storage::disk('public')->assertExists($user->avatar);
    }

    #[Test]
    public function oauth_avatar_url_is_not_deleted_during_upload(): void
    {
        $oauthUrl = 'https://lh3.googleusercontent.com/photo.jpg';
        $user     = $this->makeUser(['avatar' => $oauthUrl]);

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        $user->refresh();
        Storage::disk('public')->assertExists($user->avatar);
    }

    #[Test]
    public function user_without_existing_avatar_can_upload_without_errors(): void
    {
        $user = $this->makeUser(['avatar' => null]);

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk()
            ->assertJson(['success' => true]);
    }

    // ── GET profile reflects new avatar ───────────────────────────────────────

    #[Test]
    public function get_profile_returns_updated_avatar_url_after_upload(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        $profileResponse = $this->actingAs($user, 'api')
            ->getJson('/api/profile')
            ->assertOk();

        $this->assertNotNull($profileResponse->json('profile.avatar'));
        $this->assertStringContainsString('avatars/', $profileResponse->json('profile.avatar'));
    }

    // ── Validation failures ───────────────────────────────────────────────────

    #[Test]
    public function upload_fails_when_no_file_is_provided(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['avatar' => ['Please select an image file to upload.']]);
    }

    #[Test]
    public function upload_fails_when_file_exceeds_2mb(): void
    {
        $user = $this->makeUser();

        $largeFile = UploadedFile::fake()->create('big.jpg', 2049, 'image/jpeg');

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', ['avatar' => $largeFile])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['avatar' => ['Avatar file size must not exceed 2 MB.']]);
    }

    #[Test]
    public function upload_fails_when_file_mime_type_is_not_an_image(): void
    {
        $user = $this->makeUser();

        $textFile = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', ['avatar' => $textFile])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function upload_fails_for_a_non_image_file_with_a_renamed_jpg_extension(): void
    {
        $user = $this->makeUser();

        $masquerading = UploadedFile::fake()->create('malicious.jpg', 100, 'text/plain');

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', ['avatar' => $masquerading])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function upload_fails_when_file_type_is_gif(): void
    {
        $user = $this->makeUser();

        $gif = UploadedFile::fake()->create('anim.gif', 200, 'image/gif');

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', ['avatar' => $gif])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    // ── Database persistence ───────────────────────────────────────────────────

    #[Test]
    public function avatar_relative_path_is_persisted_to_the_database(): void
    {
        $user = $this->makeUser(['avatar' => null]);

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', [
                'avatar' => $this->fakeImage(),
            ])
            ->assertOk();

        $user->refresh();
        $this->assertNotNull($user->avatar);
        $this->assertDatabaseHas('users', [
            'id'     => $user->id,
            'avatar' => $user->avatar,
        ]);
    }

    #[Test]
    public function second_upload_replaces_first_and_leaves_only_one_file_in_storage(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', ['avatar' => $this->fakeImage()])
            ->assertOk();

        $user->refresh();
        $firstPath = $user->avatar;
        Storage::disk('public')->assertExists($firstPath);

        $this->actingAs($user, 'api')
            ->postJson('/api/profile/avatar', ['avatar' => $this->fakeImage()])
            ->assertOk();

        $user->refresh();
        $secondPath = $user->avatar;

        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists($secondPath);
        $this->assertNotEquals($firstPath, $secondPath);
    }
}
