<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_rate_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('old_rate');
            $table->unsignedBigInteger('new_rate');
            $table->unsignedSmallInteger('allowance_year');
            $table->timestamps();

            $table->index(['user_id', 'allowance_year'], 'user_rate_logs_user_year_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_rate_logs');
    }
};
