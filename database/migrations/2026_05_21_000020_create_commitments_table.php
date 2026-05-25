<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE commitments ADD CONSTRAINT commitments_amounts_valid CHECK (goal_amount > 0 AND current_amount >= 0)');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE commitments DROP CHECK commitments_amounts_valid');
        }

        Schema::dropIfExists('commitments');
    }
};
