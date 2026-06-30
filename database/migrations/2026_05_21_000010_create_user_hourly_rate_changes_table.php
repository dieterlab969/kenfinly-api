<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }

    public function down(): void
    {
        Schema::dropIfExists('user_hourly_rate_changes');
    }
};
