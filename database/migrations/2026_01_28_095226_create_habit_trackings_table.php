<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('habit_trackings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habit_id')->constrained()->onDelete('cascade');
            $table->date('date');
            $table->boolean('completed')->default(false);
            $table->timestamps();

            $table->unique(['habit_id', 'date']);
            $table->index(['habit_id', 'completed']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('habit_trackings');
    }
};
