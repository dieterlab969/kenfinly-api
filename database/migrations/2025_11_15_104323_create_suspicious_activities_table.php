<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('suspicious_activities', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45);
            $table->string('email')->nullable();
            $table->string('username')->nullable();
            $table->string('reason');
            $table->text('user_agent')->nullable();
            $table->json('request_data')->nullable();
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium');
            $table->timestamps();
            
            $table->index('ip_address');
            $table->index('email');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suspicious_activities');
    }
};
