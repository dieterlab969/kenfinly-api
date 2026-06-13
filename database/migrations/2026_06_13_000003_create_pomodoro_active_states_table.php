<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the active Pomodoro state table.
     *
     * Each user may own at most one active state row, which enables the server
     * to restore a running timer accurately across devices.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('pomodoro_active_states', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->timestamp('client_timer_started_at');
            $table->unsignedInteger('duration_seconds')->default(1500);
            $table->boolean('is_paused')->default(false);
            $table->unsignedInteger('remaining_seconds')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    /**
     * Drop the active Pomodoro state table.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('pomodoro_active_states');
    }
};
