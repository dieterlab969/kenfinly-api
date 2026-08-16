<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use App\Http\Requests\CsvExportRequest;
use App\Http\Requests\CsvImportRequest;
use App\Services\TransactionService;
use Carbon\Carbon;

/**
 * CSV import and export for financial transactions.
 *
 * @tags CSV Import / Export
 */
class CsvController extends Controller
{
    public function __construct(private readonly TransactionService $transactionService)
    {
    }

    /**
     * Export transactions to CSV.
     *
     * Returns a downloadable CSV file containing transactions matching the given filters.
     *
     * @queryParam account_id int Filter by account ID. Example: 1
     * @queryParam start_date date Start of date range (Y-m-d). Example: 2024-01-01
     * @queryParam end_date date End of date range (Y-m-d). Example: 2024-12-31
     * @queryParam type string Filter by type: income or expense. Example: expense
     */
    public function export(CsvExportRequest $request)
    {
        $userId = auth()->id();
        $filters = $request->validated();
        $query = Transaction::query();

        if (!empty($filters['account_id'])) {
            $account = Account::findOrFail($filters['account_id']);
            
            $isOwner = $account->user_id === $userId;
            $participantRole = $account->getParticipantRole($userId);
            $canExport = $isOwner || in_array($participantRole, ['owner', 'editor', 'viewer']);

            if (!$canExport) {
                return response()->json(['error' => 'Unauthorized. You do not have access to this account.'], 403);
            }

            $query->where('account_id', $filters['account_id']);
        } else {
            $accountIds = Account::where('user_id', $userId)
                ->orWhereHas('participants', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->pluck('id');

            $query->whereIn('account_id', $accountIds);
        }

        if (!empty($filters['start_date'])) {
            $query->where('transaction_date', '>=', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $query->where('transaction_date', '<=', $filters['end_date']);
        }

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        $transactions = $query->with(['account', 'category'])->orderBy('transaction_date', 'desc')->get();

        $csvData = $this->generateCsvContent($transactions);

        $filename = 'transactions_export_' . now()->format('Y-m-d_His') . '.csv';

        return response($csvData, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    private function generateCsvContent($transactions)
    {
        $csvContent = "Date,Account,Category,Type,Amount,Currency,Description,Notes\n";

        foreach ($transactions as $transaction) {
            $row = [
                $this->escapeCsvField($transaction->transaction_date),
                $this->escapeCsvField($transaction->account->name ?? ''),
                $this->escapeCsvField($transaction->category->name ?? ''),
                $this->escapeCsvField($transaction->type),
                $this->escapeCsvField($transaction->amount),
                $this->escapeCsvField($transaction->currency),
                $this->escapeCsvField($transaction->description ?? ''),
                $this->escapeCsvField($transaction->notes ?? ''),
            ];

            $csvContent .= implode(',', $row) . "\n";
        }

        return $csvContent;
    }

    private function escapeCsvField($field)
    {
        $field = (string) $field;
        
        if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
            return '"' . str_replace('"', '""', $field) . '"';
        }
        return $field;
    }

    public function import(CsvImportRequest $request)
    {
        $account = Account::findOrFail($request->validated('account_id'));

        $isOwner = $account->user_id === auth()->id();
        $participantRole = $account->getParticipantRole(auth()->id());
        $canImport = $isOwner || in_array($participantRole, ['owner', 'editor']);

        if (!$canImport) {
            return response()->json(['error' => 'Unauthorized. You must be the account owner or have owner/editor role.'], 403);
        }

        $file = $request->file('file');
        
        if (!$file->isValid()) {
            return response()->json(['error' => 'Invalid file upload'], 400);
        }

        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        
        if (empty($csvData)) {
            return response()->json(['error' => 'CSV file is empty'], 400);
        }

        $header = array_shift($csvData);
        
        $expectedHeaders = ['Date', 'Account', 'Category', 'Type', 'Amount', 'Currency', 'Description', 'Notes'];
        $headerNormalized = array_map('trim', $header);
        
        if ($headerNormalized !== $expectedHeaders) {
            return response()->json([
                'error' => 'Invalid CSV format. Expected headers: ' . implode(', ', $expectedHeaders),
                'received' => implode(', ', $headerNormalized)
            ], 400);
        }

        $results = [
            'total' => count($csvData),
            'success' => 0,
            'failed' => 0,
            'errors' => []
        ];

        try {
            foreach ($csvData as $index => $row) {
                $rowNumber = $index + 2;

                if (count($row) < 8) {
                    $results['failed']++;
                    $results['errors'][] = "Row {$rowNumber}: Insufficient columns";
                    continue;
                }

                try {
                    $transactionDate = $this->parseDate($row[0]);
                    $categoryName = trim($row[2]);
                    $type = strtolower(trim($row[3]));
                    $amount = floatval($row[4]);
                    $currency = trim($row[5]) ?: 'USD';
                    $description = trim($row[6]);
                    $notes = trim($row[7]);

                    if (!in_array($type, ['income', 'expense'])) {
                        $results['failed']++;
                        $results['errors'][] = "Row {$rowNumber}: Invalid type '{$type}'. Must be 'income' or 'expense'";
                        continue;
                    }

                    if ($amount <= 0) {
                        $results['failed']++;
                        $results['errors'][] = "Row {$rowNumber}: Amount must be greater than 0";
                        continue;
                    }

                    $category = Category::firstOrCreate(
                        ['name' => $categoryName, 'user_id' => auth()->id()],
                        ['type' => $type]
                    );

                    $this->transactionService->create(
                        auth('api')->user(),
                        [
                            'account_id' => $account->id,
                            'category_id' => $category->id,
                            'type' => $type,
                            'amount' => $amount,
                            'transaction_date' => $transactionDate,
                            'notes' => $notes ?: null,
                        ],
                        null,
                        $account
                    );

                    $results['success']++;

                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "Row {$rowNumber}: {$e->getMessage()}";
                }
            }

            return response()->json([
                'success' => true,
                'data' => $results,
                'message' => 'CSV import completed',
                'summary' => $results
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
                'error' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function parseDate($dateString)
    {
        $dateString = trim($dateString);

        $formats = [
            'Y-m-d',
            'm/d/Y',
            'd/m/Y',
            'Y/m/d',
            'd-m-Y',
            'm-d-Y',
        ];

        foreach ($formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $dateString);
                if ($date !== false) {
                    return $date->format('Y-m-d');
                }
            } catch (\Exception $e) {
                continue;
            }
        }

        throw new \Exception("Invalid date format: {$dateString}");
    }
}
