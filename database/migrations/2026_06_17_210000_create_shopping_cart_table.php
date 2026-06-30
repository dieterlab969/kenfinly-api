<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persistent shopping-cart storage for the darryldecode/cart package.
 *
 * Each row stores one "slot" of cart data (items OR conditions) for a given
 * cart session, identified by `cart_key`.  The key format is:
 *   {session_id}_cart_items       — serialised CartCollection
 *   {session_id}_cart_conditions  — serialised CartConditionCollection
 *
 * `user_id` is written the moment a JWT-authenticated user submits the
 * checkout form, associating the session-keyed cart with an account so it
 * can be queried by user and cleaned up even without an active PHP session.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shopping_cart', function (Blueprint $table) {
            $table->id();

            $table->string('cart_key')->unique();
            $table->longText('cart_value');

            $table->unsignedBigInteger('user_id')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shopping_cart');
    }
};
