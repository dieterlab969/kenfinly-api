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
        Schema::create('payment_gateway_credentials', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payment_gateway_id');
            $table->string('environment');
            $table->string('credential_key');
            $table->text('encrypted_value');
            $table->string('encryption_algorithm')->default('AES-256-CBC');
            $table->boolean('is_test')->default(false);
            $table->boolean('verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            
            $table->foreign('payment_gateway_id')->references('id')->on('payment_gateways')->onDelete('cascade');
            $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            $table->unique(['payment_gateway_id', 'environment', 'credential_key']);
            $table->index('environment');
            $table->index('verified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_gateway_credentials');
    }
};
