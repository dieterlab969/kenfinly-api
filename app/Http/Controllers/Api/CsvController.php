<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class CsvController extends Controller
{
    public function export(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'account_id' => 'nullable|exists:accounts,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userId = auth()->id();
        $query = Transaction::query();

        if ($request->account_id) {
            $account = Account::findOrFail($request->account_id);
            
            $isOwner = $account->user_id === $userId;
            $participantRole = $account->getParticipantRole($userId);
            $canExport = $isOwner || in_array($participantRole, ['owner', 'editor', 'viewer']);

            if (!$canExport) {
                return response()->json(['error' => 'Unauthorized. You do not have access to this account.'], 403);
            }

            $query->where('account_id', $request->account_id);
        } else {
            $accountIds = Account::where('user_id', $userId)
                ->orWhereHas('participants', function ($q) use ($userId) {
                    $q->where('user_id', $userId);
                })
                ->pluck('id');

            $query->whereIn('account_id', $accountIds);
        }

        if ($request->start_date) {
            $query->where('transaction_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->where('transaction_date', '<=', $request->end_date);
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
                $transaction->transaction_date,
                $transaction->account->name ?? '',
                $transaction->category->name ?? '',
                $transaction->type,
                $transaction->amount,
                $transaction->currency,
                $this->escapeCsvField($transaction->description ?? ''),
                $this->escapeCsvField($transaction->notes ?? ''),
            ];

            $csvContent .= implode(',', $row) . "\n";
        }

        return $csvContent;
    }

    private function escapeCsvField($field)
    {
        if (strpos($field, ',') !== false || strpos($field, '"') !== false || strpos($field, "\n") !== false) {
            return '"' . str_replace('"', '""', $field) . '"';
        }
        return $field;
    }

    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|mimes:csv,txt|max:10240',
            'account_id' => 'required|exists:accounts,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $account = Account::findOrFail($request->account_id);

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

        DB::beginTransaction();

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

                    Transaction::create([
                        'account_id' => $account->id,
                        'category_id' => $category->id,
                        'type' => $type,
                        'amount' => $amount,
                        'currency' => $currency,
                        'transaction_date' => $transactionDate,
                        'description' => $description,
                        'notes' => $notes,
                    ]);

                    $results['success']++;

                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "Row {$rowNumber}: {$e->getMessage()}";
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'CSV import completed',
                'summary' => $results
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
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
