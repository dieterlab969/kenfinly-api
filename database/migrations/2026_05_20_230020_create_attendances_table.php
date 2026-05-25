<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->foreignId('reward_transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->timestamp('reminder_due_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->string('kill_reason', 255)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'halo_date'], 'attendances_user_halo_date_unique');
            $table->index(['user_id', 'status', 'started_at'], 'att_user_status_started_idx');
            $table->index(['status', 'expected_end_at'], 'att_status_expected_idx');
            $table->index(['reminder_due_at', 'reminder_sent_at'], 'att_reminder_due_sent_idx');
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE attendances ADD CONSTRAINT attendances_time_order CHECK (expected_end_at > started_at AND (ended_at IS NULL OR ended_at >= started_at))');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
