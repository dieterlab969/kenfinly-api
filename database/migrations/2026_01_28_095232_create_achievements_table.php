<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to create the achievements table.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('habit_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('type');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('icon')->default('trophy');
            $table->timestamp('achieved_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'habit_id', 'type']);
            $table->index(['user_id', 'achieved_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
