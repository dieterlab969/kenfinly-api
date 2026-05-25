# Kenfinly + Halo Engine V1 Database Audit

Date: 2026-05-20

Scope: audit the proposed flat V1 schema against `../halo app v3.docx` and the current Laravel app under `api/`.

## Executive Decision

The submitted V1 schema is a good MVP sketch, but it is not complete enough for a 10-year, high-scale implementation. It misses several requirements from the document: persistent 8-hour reference time, one Halo session per user day, timezone-aware reminders, quote/vote history, commitment progress, hourly-rate governance, and ledger-to-Halo traceability.

The final design should remain flat for hot paths, but add a few non-EAV governance and summary tables where integrity or scale requires them:

- `users`: identity, role, timezone, current rate, rate lock, streak counters.
- `user_hourly_rate_changes`: immutable audit trail for 6-month rate changes.
- `attendances`: one 8-hour Halo session per user/local day, with reference timestamps.
- `transactions`: dual ledger, signed integer money, encrypted metadata fields, business date, source linkage.
- `commitments`: physical target, cached progress, local image path, deadline, kill reason.
- `ledger_daily_summaries`: write-time rollup for real-time charts over hundreds of millions of transactions.

## Business Logic Gaps

1. `users`

- Missing `timezone`; the document requires reminders at 8:00 PM in each user's local timezone.
- Missing `facebook_id`; early SSO scope reserves this.
- `role` as enum is acceptable for V1, but the existing app already has `roles`/`user_roles`. Do not mix both in production without a clear migration path.
- `hourly_rate` needs `rate_updated_at` and `hourly_rate_locked_until`. The DB can store the lock state, but exact "once every 6 months" enforcement still needs application transaction logic or a trigger.
- Streak tracking needs `longest_streak` if analytics matter over 10 years; `current_streak` alone loses history.

2. `attendances`

- Missing `halo_date`/`check_in_date`. Without it, there is no database-level one-session-per-day rule.
- Missing `expected_end_at`; this is the key requirement for reliable timer restore across refreshes, tabs, devices, and crashes.
- `ended_at` is ambiguous; keep it, but treat it as completion or kill time based on `status`.
- Missing quote/vote fields from earlier spec: `quote_text`, `quote_vote`.
- Missing reminder fields: `reminder_due_at`, `reminder_sent_at`.
- Missing `earned_amount` and `reward_transaction_id`, which are needed to audit DONE -> Halo reward insertion.

3. `transactions`

- `created_at` should not be the only business date. Backdated imports and user-entered transactions need `transaction_date`.
- `category VARCHAR(255)` is convenient but expensive. Cap it to 80 or 120 bytes on a hot table.
- `description TEXT` on a massive hot table causes storage and buffer-pool pressure. Use bounded text or encrypted text columns.
- If AES encryption uses random IVs, encrypted columns are not searchable or aggregatable. Real-time charts need either plaintext operational `amount_minor` or write-time rollups. This design keeps `amount_minor` for performance and also stores encrypted amount/description fields for defense-in-depth. If zero-plaintext finance storage is mandatory, remove `amount_minor` and make `ledger_daily_summaries` the only chart source, populated at write time in the app.
- Missing idempotency key; retries can duplicate transactions and rewards.
- Missing source linkage (`source_type`, `source_id`) for Halo reward rows.

4. `commitments`

- Missing `current_amount`; otherwise every progress render requires a ledger scan.
- Missing `completed_at`, `killed_at`, and `kill_reason`.
- `image_path` is okay for staging but should not expose local filesystem paths to clients.
- Needs indexes by user/status/deadline for countdown views.

## Scale And Retention Assessment

- `BIGINT UNSIGNED` IDs are correct for 10-year growth.
- Signed `BIGINT` money in minor units is correct for VND/Halo integer accounting and avoids decimal rounding errors.
- Hot transaction reads need composite indexes aligned to actual predicates: `(user_id, ledger_type, transaction_date, id)` for charts and `(user_id, ledger_type, created_at, id)` for append timeline.
- `attendances` needs `UNIQUE(user_id, halo_date)` to structurally prevent duplicate daily sessions.
- Real-time timer updates must not write every second. Store `started_at` and `expected_end_at`; calculate remaining seconds from server time.
- Hundreds of millions of rows require rollups. `ledger_daily_summaries` prevents dashboard `SUM()` queries from scanning years of raw rows.
- Consider MySQL partitioning by `transaction_date` or `created_at` once raw `transactions` exceeds operational maintenance limits. Laravel migrations alone are not enough for long-term partition management.
- Avoid `cascadeOnDelete()` for regulated financial retention if users can self-delete. Prefer anonymization plus `restrictOnDelete()` in production. The code below keeps cascades only where the V1 requirement explicitly requested it; review this before real launch.

## Final Laravel Migration Code

This is the canonical greenfield schema. In the current `api` project, `users` and `transactions` already exist, so apply this as a refactor plan or split it into additive migrations.

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 191)->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();
            $table->string('facebook_id', 191)->nullable()->unique();
            $table->enum('role', ['user', 'admin'])->default('user');
            $table->string('timezone', 64)->default('UTC');
            $table->bigInteger('hourly_rate')->default(100000);
            $table->timestamp('rate_updated_at')->nullable();
            $table->timestamp('hourly_rate_locked_until')->nullable();
            $table->unsignedInteger('current_streak')->default(0);
            $table->unsignedInteger('longest_streak')->default(0);
            $table->date('last_halo_date')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index(['role', 'created_at'], 'users_role_created_idx');
            $table->index(['timezone', 'id'], 'users_timezone_id_idx');
        });

        Schema::create('user_hourly_rate_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->bigInteger('old_hourly_rate')->nullable();
            $table->bigInteger('new_hourly_rate');
            $table->timestamp('changed_at');
            $table->timestamp('next_allowed_at');
            $table->timestamps();

            $table->index(['user_id', 'changed_at'], 'rate_changes_user_changed_idx');
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('halo_date');
            $table->enum('status', ['initiated', 'completed', 'killed'])->default('initiated');
            $table->timestamp('started_at');
            $table->timestamp('expected_end_at');
            $table->timestamp('ended_at')->nullable();
            $table->enum('user_rating', ['excellent', 'normal', 'laggy'])->nullable();
            $table->text('quote_text')->nullable();
            $table->enum('quote_vote', ['agree', 'disagree'])->nullable();
            $table->bigInteger('earned_amount')->default(0);
            $table->foreignId('reward_transaction_id')->nullable();
            $table->timestamp('reminder_due_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->string('kill_reason', 255)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'halo_date'], 'attendances_user_halo_date_unique');
            $table->index(['user_id', 'status', 'started_at'], 'att_user_status_started_idx');
            $table->index(['status', 'expected_end_at'], 'att_status_expected_idx');
            $table->index(['reminder_due_at', 'reminder_sent_at'], 'att_reminder_due_sent_idx');
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('ledger_type', ['real', 'halo']);
            $table->bigInteger('amount_minor');
            $table->binary('amount_ciphertext')->nullable();
            $table->string('category', 80);
            $table->binary('category_ciphertext')->nullable();
            $table->string('description', 500)->nullable();
            $table->binary('description_ciphertext')->nullable();
            $table->date('transaction_date');
            $table->string('currency', 3)->default('VND');
            $table->enum('source_type', ['manual', 'halo_reward', 'import', 'adjustment'])->default('manual');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->char('idempotency_key', 64)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'idempotency_key'], 'transactions_user_idempotency_unique');
            $table->index(['user_id', 'ledger_type', 'transaction_date', 'id'], 'txn_user_ledger_date_id_idx');
            $table->index(['user_id', 'ledger_type', 'created_at', 'id'], 'txn_user_ledger_created_id_idx');
            $table->index(['user_id', 'ledger_type', 'category', 'transaction_date'], 'txn_user_ledger_category_date_idx');
            $table->index(['source_type', 'source_id'], 'txn_source_idx');
        });

        Schema::table('attendances', function (Blueprint $table) {
            $table->foreign('reward_transaction_id')
                ->references('id')
                ->on('transactions')
                ->nullOnDelete();
        });

        Schema::create('commitments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 160);
            $table->bigInteger('goal_amount');
            $table->bigInteger('current_amount')->default(0);
            $table->string('image_path', 255)->nullable();
            $table->timestamp('deadline');
            $table->enum('status', ['active', 'completed', 'killed'])->default('active');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('killed_at')->nullable();
            $table->string('kill_reason', 255)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'deadline'], 'commit_user_status_deadline_idx');
            $table->index(['user_id', 'status', 'created_at'], 'commit_user_status_created_idx');
        });

        Schema::create('ledger_daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('ledger_type', ['real', 'halo']);
            $table->date('summary_date');
            $table->bigInteger('income_minor')->default(0);
            $table->bigInteger('expense_minor')->default(0);
            $table->bigInteger('net_minor')->default(0);
            $table->unsignedInteger('transaction_count')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'ledger_type', 'summary_date'], 'ledger_daily_user_ledger_date_unique');
            $table->index(['summary_date', 'ledger_type'], 'ledger_daily_date_ledger_idx');
        });

        DB::statement('ALTER TABLE users ADD CONSTRAINT users_hourly_rate_non_negative CHECK (hourly_rate >= 0)');
        DB::statement('ALTER TABLE attendances ADD CONSTRAINT attendances_time_order CHECK (expected_end_at > started_at AND (ended_at IS NULL OR ended_at >= started_at))');
        DB::statement('ALTER TABLE transactions ADD CONSTRAINT transactions_amount_non_zero CHECK (amount_minor <> 0)');
        DB::statement('ALTER TABLE commitments ADD CONSTRAINT commitments_amounts_valid CHECK (goal_amount > 0 AND current_amount >= 0)');
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropForeign(['reward_transaction_id']);
        });

        Schema::dropIfExists('ledger_daily_summaries');
        Schema::dropIfExists('commitments');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('user_hourly_rate_changes');
        Schema::dropIfExists('users');
    }
};
```

## Current Project Refactor Notes

The existing app already has `transactions` with `account_id`, `category_id`, decimal `amount`, `type`, and `transaction_date`. Do not blindly replace that migration in a live database. The safer path is:

1. Add Halo fields to the existing `users` table.
2. Create new `attendances`, `commitments`, `user_hourly_rate_changes`, and `ledger_daily_summaries` migrations.
3. Add `ledger_type`, `amount_minor`, source/idempotency/encrypted columns to existing `transactions`.
4. Backfill `amount_minor = amount * 100` only if the current decimal values are major units. For VND data already stored as whole VND, backfill directly without multiplying.
5. Add composite indexes after backfill using online DDL where possible.

