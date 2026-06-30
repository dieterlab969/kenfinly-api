<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the historical Pomodoro sessions table.
     *
     * Completed and interrupted focus blocks are stored here so the application
     * can rebuild analytics independently from the single active timer state.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('pomodoro_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['completed', 'interrupted']);
            $table->timestamps();

            $table->index(['user_id', 'completed_at'], 'pomodoro_sessions_user_completed_idx');
        });
    }

    /**
     * Drop the historical Pomodoro sessions table.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('pomodoro_sessions');
    }
};
