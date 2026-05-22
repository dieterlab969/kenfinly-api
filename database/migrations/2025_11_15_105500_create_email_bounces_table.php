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
        Schema::create('email_bounces', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('bounce_type')->nullable(); // hard, soft, complaint
            $table->string('bounce_reason')->nullable();
            $table->text('bounce_details')->nullable();
            $table->string('email_type')->nullable(); // verification, notification, etc.
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('bounce_count')->default(1);
            $table->timestamp('first_bounced_at');
            $table->timestamp('last_bounced_at');
            $table->timestamps();

            // Index for quick lookups
            $table->index(['email', 'bounce_type']);
            $table->index('last_bounced_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_bounces');
    }
};
