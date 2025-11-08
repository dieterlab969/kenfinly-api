<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ImportCsvTransactions extends Command
{
    protected $signature = 'transactions:import-csv {file} {email}';

    protected $description = 'Import transactions from CSV file for a specific user';

    public function handle()
    {
        $filePath = $this->argument('file');
        $email = $this->argument('email');

        // Validate file exists
        if (!file_exists($filePath)) {
            $this->error("File not found: {$filePath}");
            return 1;
        }

        // Find user
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        $this->info("Starting CSV import for user: {$user->name} ({$user->email})");

        // Get or create VND account for this user
        $account = $user->accounts()->where('currency', 'VND')->first();
        if (!$account) {
            $account = Account::create([
                'user_id' => $user->id,
                'name' => 'VND Wallet (Imported)',
                'balance' => 0.00,
                'currency' => 'VND',
                'icon' => '💵',
                'color' => '#10b981',
            ]);
            $this->info("Created new VND account: {$account->name}");
        } else {
            $this->info("Using existing VND account: {$account->name}");
        }

        // Get or create categories for imported transactions
        $incomeCategory = Category::firstOrCreate(
            ['name' => 'Imported Income', 'type' => 'income'],
            ['slug' => 'imported-income', 'icon' => '💰', 'color' => '#10b981']
        );

        $expenseCategory = Category::firstOrCreate(
            ['name' => 'Imported Expense', 'type' => 'expense'],
            ['slug' => 'imported-expense', 'icon' => '📊', 'color' => '#ef4444']
        );

        // Parse CSV
        $csvData = $this->parseCsv($filePath);
        if (empty($csvData)) {
            $this->error("No data found in CSV file.");
            return 1;
        }

        $this->info("Found " . count($csvData) . " months of data to import.");

        DB::beginTransaction();
        try {
            $totalIncome = 0;
            $totalExpense = 0;
            $transactionCount = 0;

            foreach ($csvData as $row) {
                $month = $this->parseMonth($row['Date']);
                $income = abs((float) $row['Income']);
                $expense = abs((float) $row['Expense']);

                $this->info("Processing {$month->format('F Y')} - Income: {$income} VND, Expense: {$expense} VND");

                // Create income transaction on the 1st day of the month
                if ($income > 0) {
                    Transaction::create([
                        'user_id' => $user->id,
                        'account_id' => $account->id,
                        'category_id' => $incomeCategory->id,
                        'type' => 'income',
                        'amount' => $income,
                        'notes' => "Imported income for {$month->format('F Y')}",
                        'transaction_date' => $month->copy()->startOfMonth(),
                    ]);
                    $account->increment('balance', $income);
                    $totalIncome += $income;
                    $transactionCount++;
                }

                // Distribute expenses across all days in the month
                if ($expense > 0) {
                    $daysInMonth = $month->daysInMonth;
                    $dailyExpense = $expense / $daysInMonth;
                    $distributedTotal = 0;

                    for ($day = 1; $day <= $daysInMonth; $day++) {
                        // For the last day, use the remaining amount to ensure exact total
                        if ($day === $daysInMonth) {
                            $amount = $expense - $distributedTotal;
                        } else {
                            $amount = round($dailyExpense, 2);
                            $distributedTotal += $amount;
                        }

                        Transaction::create([
                            'user_id' => $user->id,
                            'account_id' => $account->id,
                            'category_id' => $expenseCategory->id,
                            'type' => 'expense',
                            'amount' => $amount,
                            'notes' => "Imported expense for {$month->format('F Y')} (Day {$day})",
                            'transaction_date' => $month->copy()->day($day),
                        ]);

                        $account->decrement('balance', $amount);
                        $transactionCount++;
                    }

                    $totalExpense += $expense;
                }
            }

            DB::commit();

            $this->info("\n✅ Import completed successfully!");
            $this->info("Total transactions created: {$transactionCount}");
            $this->info("Total income: " . number_format($totalIncome, 0) . " VND");
            $this->info("Total expense: " . number_format($totalExpense, 0) . " VND");
            $this->info("Final account balance: " . number_format($account->fresh()->balance, 2) . " VND");

            return 0;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Error during import: " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return 1;
        }
    }

    private function parseCsv(string $filePath): array
    {
        $data = [];
        $file = fopen($filePath, 'r');

        // Skip header row
        $header = fgetcsv($file);

        while (($row = fgetcsv($file)) !== false) {
            if (count($row) >= 4) {
                $data[] = [
                    'Date' => $row[0],
                    'Income' => $row[1],
                    'Expense' => $row[2],
                    'Total' => $row[3],
                ];
            }
        }

        fclose($file);
        return $data;
    }

    private function parseMonth(string $dateString): Carbon
    {
        // Handle format like "12/2023" or "01/2024"
        if (preg_match('/^(\d{1,2})\/(\d{4})$/', $dateString, $matches)) {
            $month = (int) $matches[1];
            $year = (int) $matches[2];
            return Carbon::create($year, $month, 1);
        }

        // Fallback to Carbon's parser for other formats
        return Carbon::parse($dateString);
    }
}
