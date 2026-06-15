<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class ReencryptTransactionNotes extends Command
{
    protected $signature = 'transactions:reencrypt-notes
                            {--dry-run : Show counts without writing}
                            {--chunk=200 : Number of rows per chunk}';

    protected $description = 'Encrypt any transactions.notes rows that are still stored as plain text.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $chunk = max(1, (int) $this->option('chunk'));

        $total = DB::table('transactions')->whereNotNull('notes')->count();
        $this->info("Scanning {$total} transactions with non-null notes (chunk={$chunk}, dry-run=" . ($dryRun ? 'yes' : 'no') . ')');

        $encrypted = 0;
        $skippedAlreadyEncrypted = 0;
        $skippedForeignKey = 0;
        $skippedEmpty = 0;
        $failed = 0;
        $foreignKeyIds = [];

        DB::table('transactions')
            ->select('id', 'notes')
            ->whereNotNull('notes')
            ->orderBy('id')
            ->chunkById($chunk, function ($rows) use (
                &$encrypted, &$skippedAlreadyEncrypted, &$skippedForeignKey,
                &$skippedEmpty, &$failed, &$foreignKeyIds, $dryRun
            ) {
                foreach ($rows as $row) {
                    $value = $row->notes;

                    if ($value === '' || $value === null) {
                        $skippedEmpty++;
                        continue;
                    }

                    try {
                        Crypt::decrypt($value);
                        $skippedAlreadyEncrypted++;
                        continue;
                    } catch (DecryptException) {
                        // Either plain text, or encrypted with a different APP_KEY.
                    }

                    // Don't re-encrypt anything that already looks like a Laravel
                    // encrypted payload (base64 JSON with iv/value/mac). Doing so
                    // would double-wrap a ciphertext we just can't read with the
                    // current key, making recovery impossible if the old key is
                    // ever restored.
                    if ($this->looksEncrypted($value)) {
                        $skippedForeignKey++;
                        $foreignKeyIds[] = $row->id;
                        continue;
                    }

                    try {
                        $cipher = Crypt::encrypt($value);
                    } catch (\Throwable $e) {
                        $failed++;
                        $this->warn("  id={$row->id}: encrypt failed: {$e->getMessage()}");
                        continue;
                    }

                    if (! $dryRun) {
                        DB::table('transactions')->where('id', $row->id)->update(['notes' => $cipher]);
                    }
                    $encrypted++;
                }
            });

        $this->newLine();
        $this->info('Summary:');
        $this->line("  encrypted:                       {$encrypted}" . ($dryRun ? ' (dry-run, not written)' : ''));
        $this->line("  already encrypted (skip):        {$skippedAlreadyEncrypted}");
        $this->line("  encrypted w/ foreign key (skip): {$skippedForeignKey}");
        $this->line("  empty (skip):                    {$skippedEmpty}");
        $this->line("  failed:                          {$failed}");

        if ($skippedForeignKey > 0) {
            $sample = array_slice($foreignKeyIds, 0, 10);
            $this->warn('Foreign-key rows (cannot be decrypted with current APP_KEY): ' . implode(', ', $sample)
                . ($skippedForeignKey > count($sample) ? ' …' : ''));
            $this->warn('Leave these alone unless you can restore the previous key.');
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Cheap check that a string is shaped like a Laravel ciphertext payload
     * (base64-encoded JSON with iv/value/mac keys). False negatives are fine —
     * we use this only to *avoid* re-encrypting something already encrypted.
     */
    private function looksEncrypted(string $value): bool
    {
        $decoded = base64_decode($value, true);
        if ($decoded === false) {
            return false;
        }
        $json = json_decode($decoded, true);
        return is_array($json)
            && array_key_exists('iv', $json)
            && array_key_exists('value', $json)
            && array_key_exists('mac', $json);
    }
}
