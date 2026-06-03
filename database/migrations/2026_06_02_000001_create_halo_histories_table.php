<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('halo_histories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('actual_seconds');
            $table->unsignedInteger('max_seconds');   // 28800 (pre-noon) or 14400 (post-noon)
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_id', 'date'], 'halo_histories_user_date_unique');
            $table->index('date', 'idx_halo_hist_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('halo_histories');
    }
};
