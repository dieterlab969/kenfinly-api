<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\TransactionIndexRequest;
use App\Http\Requests\TransactionPhotoRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use App\Models\TransactionPhoto;
use App\Services\TransactionAnalyticsService;
use App\Services\TransactionChangeLogService;
use App\Services\TransactionPhotoService;
use App\Services\TransactionQuery;
use App\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * HTTP adapter for transaction use cases.
 *
 * Validation, authorization, persistence, balance/ledger synchronization,
 * photo management, and analytics are intentionally kept outside this class.
 */
class TransactionController extends Controller
{
    public function __construct(
        private readonly TransactionService $transactionService,
        private readonly TransactionQuery $transactionQuery,
        private readonly TransactionAnalyticsService $analytics,
        private readonly TransactionPhotoService $photoService,
        private readonly TransactionChangeLogService $changeLogService,
    ) {
        $this->authorizeResource(Transaction::class, 'transaction');
    }

    public function index(TransactionIndexRequest $request): JsonResponse
    {
        $transactions = $this->transactionQuery->paginateForUser(
            (int) auth('api')->id(),
            $request->validated()
        );

        // `transactions` is retained for existing consumers. `data` is the
        // canonical field used by newly migrated clients.
        return response()->json([
            'success' => true,
            'data' => $transactions,
            'transactions' => $transactions,
        ]);
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $user = auth('api')->user();
        if ($user->accounts()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'You must have at least one account to create transactions. Please create an account first.',
                'errors' => [],
            ], 400);
        }

        try {
            $transaction = $this->transactionService->create(
                $user,
                $request->validated(),
                $request->file('receipt')
            );

            return response()->json([
                'success' => true,
                'message' => 'Transaction created successfully',
                'data' => new TransactionResource($transaction),
                'transaction' => $transaction,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Transaction creation failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction',
                'errors' => [],
            ], 500);
        }
    }

    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load([
            'category',
            'account',
            'photos.uploader:id,name,email',
            'changeLogs.user:id,name,email',
        ]);
        $canEdit = auth('api')->user()->hasAnyRole(['owner', 'editor']);

        return response()->json([
            'success' => true,
            'data' => new TransactionResource($transaction),
            'transaction' => $transaction,
            'permissions' => [
                'can_edit' => $canEdit,
                'can_manage_photos' => $canEdit,
            ],
        ]);
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): JsonResponse
    {
        try {
            $updated = $this->transactionService->update(
                auth('api')->user(),
                $transaction,
                $request->validated(),
                $request->file('receipt')
            );

            return response()->json([
                'success' => true,
                'message' => 'Transaction updated successfully',
                'data' => new TransactionResource($updated),
                'transaction' => $updated,
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => []], 405);
        } catch (\Throwable $e) {
            Log::error('Transaction update failed', ['transaction_id' => $transaction->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to update transaction', 'errors' => []], 500);
        }
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        try {
            $this->transactionService->delete(auth('api')->user(), $transaction);
            return response()->json([
                'success' => true,
                'message' => 'Transaction deleted successfully',
                'data' => [],
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => []], 405);
        } catch (\Throwable $e) {
            Log::error('Transaction deletion failed', ['transaction_id' => $transaction->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to delete transaction', 'errors' => []], 500);
        }
    }

    public function addPhoto(TransactionPhotoRequest $request, Transaction $transaction): JsonResponse
    {
        $this->authorize('managePhotos', $transaction);

        try {
            $photo = $this->photoService->uploadPhoto(
                $transaction,
                $request->file('photo'),
                auth('api')->user()
            );
            $this->changeLogService->logPhotoAdded(
                $transaction,
                auth('api')->user(),
                $photo->original_filename
            );

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'data' => $photo->load('uploader:id,name,email'),
                'photo' => $photo,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Photo upload failed', ['transaction_id' => $transaction->id, 'error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage(), 'errors' => []], 400);
        }
    }

    public function deletePhoto(Request $request, int $photoId): JsonResponse
    {
        $photo = TransactionPhoto::findOrFail($photoId);
        $transaction = $photo->transaction;
        $this->authorize('managePhotos', $transaction);

        try {
            $filename = $photo->original_filename;
            $this->photoService->deletePhoto($photo);
            $this->changeLogService->logPhotoRemoved($transaction, auth('api')->user(), $filename);

            return response()->json([
                'success' => true,
                'message' => 'Photo deleted successfully',
                'data' => [],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete photo', 'errors' => []], 500);
        }
    }

    public function getDashboardData(Request $request): JsonResponse
    {
        $data = $this->analytics->dashboard(auth('api')->user());

        // Dashboard already exposed `data`; keep that exact shape.
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}