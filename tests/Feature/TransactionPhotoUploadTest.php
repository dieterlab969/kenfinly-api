<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Account;
use App\Models\Category;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class TransactionPhotoUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Account $account;
    protected Category $category;
    protected Transaction $transaction;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('public');
        
        $ownerRole = Role::create(['name' => 'owner', 'slug' => 'owner']);
        
        $this->user = User::factory()->create();
        $this->user->roles()->attach($ownerRole);
        
        $this->account = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Test Account',
            'type' => 'checking',
            'currency' => 'USD',
            'balance' => 1000,
        ]);
        
        $this->category = Category::create([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'type' => 'expense',
            'icon' => 'shopping',
        ]);
        
        $this->transaction = Transaction::create([
            'user_id' => $this->user->id,
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'type' => 'expense',
            'amount' => 50.00,
            'transaction_date' => now(),
        ]);
        
        $this->token = auth('api')->login($this->user);
    }

    public function test_user_can_upload_jpeg_photo()
    {
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600)->size(500);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Photo uploaded successfully',
            ]);
        
        $this->assertDatabaseHas('transaction_photos', [
            'transaction_id' => $this->transaction->id,
            'uploaded_by' => $this->user->id,
        ]);
    }

    public function test_user_can_upload_png_photo()
    {
        $file = UploadedFile::fake()->image('receipt.png', 800, 600)->size(500);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    public function test_upload_fails_for_non_image_files()
    {
        $file = UploadedFile::fake()->create('document.pdf', 500, 'application/pdf');
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(422);
    }

    public function test_upload_fails_for_files_exceeding_20mb()
    {
        $file = UploadedFile::fake()->image('large.jpg')->size(21000);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(422);
    }

    public function test_upload_fails_without_photo_field()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", []);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_upload_requires_authentication()
    {
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600)->size(500);
        
        $response = $this->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(401);
    }

    public function test_user_cannot_upload_to_other_users_transaction()
    {
        $otherUser = User::factory()->create();
        $otherAccount = Account::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Account',
            'type' => 'checking',
            'currency' => 'USD',
            'balance' => 500,
        ]);
        $otherTransaction = Transaction::create([
            'user_id' => $otherUser->id,
            'account_id' => $otherAccount->id,
            'category_id' => $this->category->id,
            'type' => 'expense',
            'amount' => 25.00,
            'transaction_date' => now(),
        ]);
        
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600)->size(500);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$otherTransaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(403);
    }

    public function test_user_can_delete_photo()
    {
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600)->size(500);
        
        $uploadResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $photoId = $uploadResponse->json('photo.id');
        
        $deleteResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->delete("/api/photos/{$photoId}");
        
        $deleteResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Photo deleted successfully',
            ]);
        
        $this->assertDatabaseMissing('transaction_photos', [
            'id' => $photoId,
        ]);
    }

    public function test_maximum_10_photos_per_transaction()
    {
        for ($i = 0; $i < 10; $i++) {
            $file = UploadedFile::fake()->image("receipt{$i}.jpg", 100, 100)->size(50);
            
            $this->withHeaders([
                'Authorization' => 'Bearer ' . $this->token,
            ])->post("/api/transactions/{$this->transaction->id}/photos", [
                'photo' => $file,
            ]);
        }
        
        $file = UploadedFile::fake()->image('receipt11.jpg', 100, 100)->size(50);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post("/api/transactions/{$this->transaction->id}/photos", [
            'photo' => $file,
        ]);
        
        $response->assertStatus(400);
    }

    public function test_create_transaction_with_receipt_saves_to_photos()
    {
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600)->size(500);
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post('/api/transactions', [
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'type' => 'expense',
            'amount' => 100.00,
            'transaction_date' => now()->format('Y-m-d'),
            'receipt' => $file,
        ]);
        
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Transaction created successfully',
            ]);
        
        $transactionId = $response->json('transaction.id');
        
        $this->assertDatabaseHas('transaction_photos', [
            'transaction_id' => $transactionId,
            'uploaded_by' => $this->user->id,
        ]);
        
        $photos = $response->json('transaction.photos');
        $this->assertCount(1, $photos);
    }

    public function test_create_transaction_without_receipt_works()
    {
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post('/api/transactions', [
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'type' => 'expense',
            'amount' => 50.00,
            'transaction_date' => now()->format('Y-m-d'),
        ]);
        
        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);
        
        $transactionId = $response->json('transaction.id');
        
        $this->assertDatabaseMissing('transaction_photos', [
            'transaction_id' => $transactionId,
        ]);
    }

    public function test_view_transaction_shows_photos_from_creation()
    {
        $file = UploadedFile::fake()->image('receipt.jpg', 800, 600)->size(500);
        
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->post('/api/transactions', [
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'type' => 'expense',
            'amount' => 75.00,
            'transaction_date' => now()->format('Y-m-d'),
            'receipt' => $file,
        ]);
        
        $transactionId = $createResponse->json('transaction.id');
        
        $viewResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
        ])->get("/api/transactions/{$transactionId}");
        
        $viewResponse->assertStatus(200);
        
        $photos = $viewResponse->json('transaction.photos');
        $this->assertCount(1, $photos);
        $this->assertNotEmpty($photos[0]['file_path']);
    }
}
