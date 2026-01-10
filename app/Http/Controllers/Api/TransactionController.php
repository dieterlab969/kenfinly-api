<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Account;
use App\Services\TransactionPhotoService;
use App\Services\TransactionChangeLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    protected $photoService;
    protected $changeLogService;

    public function __construct(
        TransactionPhotoService $photoService,
        TransactionChangeLogService $changeLogService
    ) {
        $this->photoService = $photoService;
        $this->changeLogService = $changeLogService;
        $this->authorizeResource(Transaction::class, 'transaction');
    }
    public function index(Request $request)
    {
        $user = auth('api')->user();
        
        $query = Transaction::where('user_id', $user->id)
            ->with(['category', 'account']);

        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('transaction_date', [
                $request->start_date,
                $request->end_date
            ]);
        }

        $transactions = $query->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'transactions' => $transactions
        ]);
    }

    public function store(Request $request)
    {
        $user = auth('api')->user();

        if ($user->accounts()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'You must have at least one account to create transactions. Please create an account first.'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'account_id' => 'required|exists:accounts,id',
            'category_id' => 'required|exists:categories,id',
            'type' => 'required|in:income,expense',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'required|date',
            'receipt' => 'nullable|image|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $account = Account::where('id', $request->account_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $uploadedPhotoPath = null;
        
        DB::beginTransaction();
        try {
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $request->account_id,
                'category_id' => $request->category_id,
                'type' => $request->type,
                'amount' => $request->amount,
                'notes' => $request->notes,
                'transaction_date' => $request->transaction_date,
            ]);

            if ($request->hasFile('receipt')) {
                $file = $request->file('receipt');
                
                Log::info('Receipt upload during transaction creation', [
                    'transaction_id' => $transaction->id,
                    'user_id' => $user->id,
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size_kb' => round($file->getSize() / 1024, 2),
                ]);
                
                $photo = $this->photoService->uploadPhoto($transaction, $file, $user);
                $uploadedPhotoPath = $photo->file_path;
                
                $this->changeLogService->logPhotoAdded(
                    $transaction,
                    $user,
                    $photo->original_filename
                );
                
                Log::info('Receipt saved successfully', [
                    'transaction_id' => $transaction->id,
                    'photo_id' => $photo->id,
                ]);
            }

            $balanceChange = $request->type === 'income' 
                ? $request->amount 
                : -$request->amount;
            
            $account->increment('balance', $balanceChange);

            $this->changeLogService->logCreate($transaction, $user);

            DB::commit();

            $transaction->load(['category', 'account', 'photos']);

            return response()->json([
                'success' => true,
                'message' => 'Transaction created successfully',
                'transaction' => $transaction
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            
            if ($uploadedPhotoPath) {
                Storage::disk('public')->delete($uploadedPhotoPath);
                Log::info('Cleaned up orphaned photo after transaction creation failure', [
                    'file_path' => $uploadedPhotoPath,
                ]);
            }
            
            Log::error('Failed to create transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create transaction: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Transaction $transaction)
    {
        $transaction->load([
            'category',
            'account',
            'photos.uploader:id,name,email',
            'changeLogs.user:id,name,email'
        ]);

        $user = auth('api')->user();
        $canEdit = $user->hasAnyRole(['owner', 'editor']);

        return response()->json([
            'success' => true,
            'transaction' => $transaction,
            'permissions' => [
                'can_edit' => $canEdit,
                'can_manage_photos' => $canEdit,
            ]
        ]);
    }

    public function update(Request $request, Transaction $transaction)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'sometimes|required|exists:accounts,id',
            'category_id' => 'sometimes|required|exists:categories,id',
            'type' => 'sometimes|required|in:income,expense',
            'amount' => 'sometimes|required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'transaction_date' => 'sometimes|required|date',
            'receipt' => 'nullable|image|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = auth('api')->user();

        if ($request->has('account_id')) {
            $newAccount = Account::where('id', $request->account_id)
                ->where('user_id', $user->id)
                ->firstOrFail();
        }

        $oldData = [
            'type' => $transaction->type,
            'amount' => (string)$transaction->amount,
            'category_id' => $transaction->category_id,
            'account_id' => $transaction->account_id,
            'notes' => $transaction->notes,
            'transaction_date' => $transaction->transaction_date->format('Y-m-d'),
        ];

        DB::beginTransaction();
        try {
            $oldAmount = $transaction->amount;
            $oldType = $transaction->type;
            $oldAccountId = $transaction->account_id;

            $oldAccount = Account::where('id', $oldAccountId)
                ->where('user_id', $user->id)
                ->firstOrFail();
            $oldBalanceChange = $oldType === 'income' ? -$oldAmount : $oldAmount;
            $oldAccount->increment('balance', $oldBalanceChange);

            if ($request->hasFile('receipt')) {
                if ($transaction->receipt_path) {
                    Storage::disk('public')->delete($transaction->receipt_path);
                }
                $transaction->receipt_path = $request->file('receipt')->store('receipts', 'public');
            }

            $transaction->fill($request->except('receipt'));
            $transaction->save();

            $newAccount = Account::where('id', $transaction->account_id)
                ->where('user_id', $user->id)
                ->firstOrFail();
            $newBalanceChange = $transaction->type === 'income' 
                ? $transaction->amount 
                : -$transaction->amount;
            $newAccount->increment('balance', $newBalanceChange);

            $this->changeLogService->logUpdate($transaction, $user, $oldData);

            DB::commit();

            $transaction->load(['category', 'account', 'photos', 'changeLogs']);

            return response()->json([
                'success' => true,
                'message' => 'Transaction updated successfully',
                'transaction' => $transaction
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to update transaction'
            ], 500);
        }
    }

    public function destroy(Transaction $transaction)
    {
        $user = auth('api')->user();

        DB::beginTransaction();
        try {
            $account = Account::findOrFail($transaction->account_id);
            $balanceChange = $transaction->type === 'income' 
                ? -$transaction->amount 
                : $transaction->amount;
            $account->increment('balance', $balanceChange);

            $this->changeLogService->logDelete($transaction, $user);

            if ($transaction->receipt_path) {
                Storage::disk('public')->delete($transaction->receipt_path);
            }

            foreach ($transaction->photos as $photo) {
                $this->photoService->deletePhoto($photo);
            }

            $transaction->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transaction deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete transaction'
            ], 500);
        }
    }

    public function addPhoto(Request $request, Transaction $transaction)
    {
        $this->authorize('managePhotos', $transaction);

        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:20480',
        ]);

        if ($validator->fails()) {
            Log::warning('Photo upload validation failed', [
                'transaction_id' => $transaction->id,
                'errors' => $validator->errors()->toArray(),
                'content_type' => $request->header('Content-Type'),
                'has_file' => $request->hasFile('photo'),
            ]);
            
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = auth('api')->user();
            $file = $request->file('photo');
            
            Log::info('Photo upload started', [
                'transaction_id' => $transaction->id,
                'user_id' => $user->id,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size_kb' => round($file->getSize() / 1024, 2),
            ]);
            
            $photo = $this->photoService->uploadPhoto(
                $transaction,
                $file,
                $user
            );

            $this->changeLogService->logPhotoAdded(
                $transaction,
                $user,
                $photo->original_filename
            );

            $photo->load('uploader:id,name,email');

            Log::info('Photo upload successful', [
                'transaction_id' => $transaction->id,
                'photo_id' => $photo->id,
                'stored_size_kb' => round($photo->file_size / 1024, 2),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo uploaded successfully',
                'photo' => $photo
            ], 201);
        } catch (\Exception $e) {
            Log::error('Photo upload failed', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    public function deletePhoto(Request $request, $photoId)
    {
        $user = auth('api')->user();
        
        $photo = \App\Models\TransactionPhoto::findOrFail($photoId);
        $transaction = $photo->transaction;

        $this->authorize('managePhotos', $transaction);

        try {
            $filename = $photo->original_filename;
            $this->photoService->deletePhoto($photo);

            $this->changeLogService->logPhotoRemoved(
                $transaction,
                $user,
                $filename
            );

            return response()->json([
                'success' => true,
                'message' => 'Photo deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete photo'
            ], 500);
        }
    }

    public function getDashboardData(Request $request)
    {
        $user = auth('api')->user();
        
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();
        $sevenDaysAgo = $now->copy()->subDays(6);
        
        $startOfPreviousMonth = $now->copy()->subMonth()->startOfMonth();
        $endOfPreviousMonth = $now->copy()->subMonth()->endOfMonth();

        $currentIncome = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');
        
        $currentExpense = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');

        $previousIncome = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereBetween('transaction_date', [$startOfPreviousMonth, $endOfPreviousMonth])
            ->sum('amount');
        
        $previousExpense = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$startOfPreviousMonth, $endOfPreviousMonth])
            ->sum('amount');

        $monthlySummary = [
            'current' => [
                'month' => $now->format('F Y'),
                'income' => $currentIncome,
                'expense' => $currentExpense,
                'net' => $currentIncome - $currentExpense,
            ],
            'previous' => [
                'month' => $now->copy()->subMonth()->format('F Y'),
                'income' => $previousIncome,
                'expense' => $previousExpense,
                'net' => $previousIncome - $previousExpense,
            ],
        ];

        $sevenDayExpenses = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereBetween('transaction_date', [$sevenDaysAgo, $now])
            ->select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('SUM(amount) as total')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $thirtyDaysAgo = $now->copy()->subDays(29);
        $balanceHistory = [];
        $accounts = Account::where('user_id', $user->id)->get();
        $totalBalance = $accounts->sum('balance');
        
        for ($i = 29; $i >= 0; $i--) {
            $date = $now->copy()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            
            $dayTransactions = Transaction::where('user_id', $user->id)
                ->whereDate('transaction_date', '>', $dateStr)
                ->select(
                    DB::raw('SUM(CASE WHEN type = "income" THEN amount ELSE -amount END) as net_change')
                )
                ->first();
            
            $dayBalance = $totalBalance - ($dayTransactions->net_change ?? 0);
            
            $balanceHistory[] = [
                'date' => $dateStr,
                'balance' => $dayBalance,
            ];
        }

        $recentTransactions = Transaction::where('user_id', $user->id)
            ->with(['category', 'account'])
            ->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'monthly_summary' => $monthlySummary,
                'seven_day_expenses' => $sevenDayExpenses,
                'balance_history' => $balanceHistory,
                'recent_transactions' => $recentTransactions,
                'accounts' => $accounts,
            ]
        ]);
    }
}
