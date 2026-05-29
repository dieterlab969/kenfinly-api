<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Immutable Cryptographic Ledger: halo_points (Module: Users)
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE: Centralized Crypto-Ledger ("Fake Blockchain")            │
 * │  Design authority: Bill Gates × Steve Jobs session, 2026-05-29          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Primary Key    : ULID char(26) — time-ordered, globally unique         │
 * │  Immutability   : APPEND-ONLY. No updated_at. No soft deletes.          │
 * │  Anti-tamper    : SHA-256 hash chaining (previous_hash → current_hash)  │
 * │  Audit job      : Nightly chain-integrity scan (breaks on tampered row) │
 * │  Locking        : No table locks — all writes are indexed single-row    │
 * │                   INSERTs; reads use covering composite indexes          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  HASH CHAINING ALGORITHM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Each row is a "Block". The SHA-256 input string is:
 *
 *    payload = previous_hash          (64-char hex OR "GENESIS")
 *            . "|" . user_id
 *            . "|" . chain_sequence
 *            . "|" . points_delta
 *            . "|" . balance_snapshot
 *            . "|" . unix_timestamp_ms
 *
 *    current_hash = strtolower(hash('sha256', payload))
 *
 *  Tamper detection:
 *    If any field in Block N is modified by SQL, the SHA-256 of Block N
 *    changes → Block N+1's previous_hash no longer matches → chain is broken.
 *    The nightly AuditJob scans the chain per user and alerts on any gap.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  COLUMN LAYOUT (detailed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  id               char(26)        ULID primary key. Time-ordered → natural
 *                                   B-tree ordering without autoincrement.
 *
 *  user_id          ubigint         FK → users.id. Each user has their own
 *                                   independent hash chain.
 *
 *  chain_sequence   ubigint         Per-user monotonic block counter (1, 2, 3…).
 *                                   Genesis block = 1.
 *                                   UNIQUE(user_id, chain_sequence) prevents
 *                                   double-spend / fork attacks.
 *
 *  event_type       varchar(50)     What triggered this block:
 *                                     ring_completion | admin_grant
 *                                     admin_deduct    | bonus
 *                                     penalty         | system
 *
 *  reference_type   varchar(100)    Nullable. Polymorphic morph-type for the
 *                                   triggering entity (e.g. 'ring_session').
 *
 *  reference_id     char(26)        Nullable. ULID of the triggering entity
 *                                   (e.g. the ring session ULID).
 *
 *  points_delta     bigint          Signed. Positive = earned, Negative = deducted.
 *                                   Stored in full Halo Point units (not minor).
 *
 *  balance_snapshot bigint          Running total AFTER this block is applied.
 *                                   Enables O(1) "current balance" lookup on the
 *                                   latest row — no SUM() needed.
 *
 *  metadata         json            Nullable. Arbitrary context bag:
 *                                     { "halo_ring_duration_min": 25,
 *                                       "market_factor": 1.42,
 *                                       "ip": "...", "ua": "..." }
 *
 *  previous_hash    char(64)        SHA-256 (64 hex chars) of the prior block.
 *                                   NULL only on the genesis block (chain_sequence=1).
 *
 *  current_hash     char(64)        SHA-256 of this block's payload (see algorithm).
 *                                   UNIQUE globally — duplicate block = tampering.
 *
 *  created_at       timestamp       Immutable insertion time. No updated_at column.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halo_points', function (Blueprint $table) {

            // ── Primary key ────────────────────────────────────────────────
            // ULID: 26-char base32, time-sortable, no lock contention on insert
            $table->ulid('id')->primary();

            // ── Ownership ──────────────────────────────────────────────────
            $table->unsignedBigInteger('user_id')
                  ->comment('Owner of this block; each user has their own chain');

            // ── Chain position (per-user monotonic counter) ────────────────
            $table->unsignedBigInteger('chain_sequence')
                  ->comment('Block number within this user\'s chain. Starts at 1 (genesis).');

            // ── Event classification ───────────────────────────────────────
            $table->string('event_type', 50)
                  ->comment('ring_completion | admin_grant | admin_deduct | bonus | penalty | system');

            // ── Polymorphic reference to triggering entity ─────────────────
            $table->string('reference_type', 100)
                  ->nullable()
                  ->comment('Morph type of the source entity, e.g. "ring_session"');

            $table->char('reference_id', 26)
                  ->nullable()
                  ->comment('ULID of the source entity — allows reverse-lookup to ring/habit');

            // ── Financial columns ──────────────────────────────────────────
            $table->bigInteger('points_delta')
                  ->comment('Signed. +N = earned, -N = deducted. Full Halo Point units.');

            $table->bigInteger('balance_snapshot')
                  ->comment('Running balance AFTER this block. Allows O(1) balance read.');

            // ── Arbitrary context payload ──────────────────────────────────
            $table->json('metadata')
                  ->nullable()
                  ->comment('Free-form context: ring duration, market factor, IP, UA, etc.');

            // ── Cryptographic chaining columns ─────────────────────────────
            // SHA-256 produces 64 lowercase hex characters.

            $table->char('previous_hash', 64)
                  ->nullable()
                  ->comment('Hash of the preceding block. NULL only for the genesis block.');

            $table->char('current_hash', 64)
                  ->nullable(false)
                  ->comment('SHA-256(previous_hash|user_id|chain_sequence|points_delta|balance_snapshot|ts_ms)');

            // ── Temporal column — IMMUTABLE ────────────────────────────────
            // Deliberately NO updated_at: this table is append-only by design.
            $table->timestamp('created_at')
                  ->useCurrent()
                  ->comment('UTC insertion timestamp. Immutable — part of the hash payload.');

            // ══════════════════════════════════════════════════════════════
            //  INDEXES — designed to prevent table-locking on high-write load
            // ══════════════════════════════════════════════════════════════

            // Composite unique #1: prevents fork attack (two blocks at same
            // position in the same user's chain).
            // Row-level lock on INSERT — no table lock.
            $table->unique(
                ['user_id', 'chain_sequence'],
                'hp_user_chain_seq_unique'
            );

            // Unique #2: globally unique block hash — duplicate = tampered chain.
            $table->unique('current_hash', 'hp_current_hash_unique');

            // Composite index #3: user timeline (most common query: "show me
            // this user's last N blocks").
            $table->index(['user_id', 'created_at'],     'hp_user_created_idx');

            // Index #4: chain traversal — audit job walks chain backwards
            // via previous_hash → current_hash lookup.
            $table->index('previous_hash',               'hp_prev_hash_idx');

            // Composite index #5: event-type analytics per user
            // ("how many ring_completions did user X have this month?")
            $table->index(['user_id', 'event_type'],     'hp_user_event_idx');

            // Composite index #6: polymorphic reference lookup — find the
            // block(s) associated with a specific ring session ULID.
            $table->index(['reference_type', 'reference_id'], 'hp_ref_morph_idx');

            // ── Foreign key ────────────────────────────────────────────────
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->cascadeOnDelete();
        });

        // ── CHECK constraints (non-SQLite only) ───────────────────────────
        if (DB::getDriverName() !== 'sqlite') {
            // Enforce the allowed event_type vocabulary at DB level
            DB::statement("
                ALTER TABLE halo_points
                ADD CONSTRAINT hp_event_type_check
                CHECK (event_type IN (
                    'ring_completion','admin_grant','admin_deduct',
                    'bonus','penalty','system'
                ))
            ");

            // current_hash must always be a 64-char lowercase hex string
            DB::statement("
                ALTER TABLE halo_points
                ADD CONSTRAINT hp_current_hash_format_check
                CHECK (char_length(current_hash) = 64)
            ");

            // balance_snapshot must never be negative
            // (Halo Points cannot go below zero)
            DB::statement("
                ALTER TABLE halo_points
                ADD CONSTRAINT hp_balance_non_negative_check
                CHECK (balance_snapshot >= 0)
            ");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('halo_points');
    }
};
