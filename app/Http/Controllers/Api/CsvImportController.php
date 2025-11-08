<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CsvImportController extends Controller
{
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'account_id' => 'required|exists:accounts,id',
        ]);

        $account = Account::findOrFail($request->account_id);

        $isOwner = $account->user_id === auth()->id();
        $participantRole = $account->getParticipantRole(auth()->id());
        $canImport = $isOwner || in_array($participantRole, ['owner', 'editor']);

        if (!$canImport) {
            return response()->json(['error' => 'Unauthorized. You must be the account owner or have owner/editor role.'], 403);
        }

        $file = $request->file('file');
        $csvData = array_map('str_getcsv', file($file->getRealPath()));
        array_shift($csvData);

        DB::beginTransaction();
        try {
            $transactionsCreated = 0;
            foreach ($csvData as $row) {
                if (count($row) < 3) continue;
                $date = $this->parseDate($row[0]);
                $income = abs((float) ($row[1] ?? 0));
                $expense = abs((float) ($row[2] ?? 0));

                if ($income > 0) {
                    Transaction::create([
                        'user_id' => auth()->id(),
                        'account_id' => $account->id,
                        'category_id' => Category::where('type', 'income')->first()->id,
                        'type' => 'income',
                        'amount' => $income,
                        'notes' => 'CSV Import',
                        'transaction_date' => $date,
                    ]);
                    $transactionsCreated++;
                }

                if ($expense > 0) {
                    Transaction::create([
                        'user_id' => auth()->id(),
                        'account_id' => $account->id,
                        'category_id' => Category::where('type', 'expense')->first()->id,
                        'type' => 'expense',
                        'amount' => $expense,
                        'notes' => 'CSV Import',
                        'transaction_date' => $date,
                    ]);
                    $transactionsCreated++;
                }
            }

            DB::commit();
            return response()->json(['message' => 'Import successful', 'transactions_created' => $transactionsCreated]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    private function parseDate(string $dateString): Carbon
    {
        if (preg_match('/^(\d{1,2})\/(\d{4})$/', $dateString, $matches)) {
            return Carbon::create((int) $matches[2], (int) $matches[1], 1);
        }
        return Carbon::parse($dateString);
    }
}
