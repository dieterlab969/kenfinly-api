<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds social-authentication columns to the users table.
 *
 * facebook_id — stores the numeric Facebook user ID returned by Socialite;
 *               used to link an existing account to a Facebook identity and
 *               to prevent duplicate registrations via Facebook OAuth.
 *
 * avatar      — stores a URL to the user's profile picture (Google / Facebook
 *               CDN URL). Also needed by the existing GoogleAuthController
 *               which already writes this field; adding it here ensures it is
 *               always present in the schema even on fresh installs.
 *
 * Both columns are nullable so that users who registered via email/password
 * are unaffected.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('name');
            }

            if (! Schema::hasColumn('users', 'facebook_id')) {
                $table->string('facebook_id')->nullable()->unique()->after('avatar');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'facebook_id')) {
                $table->dropUnique(['facebook_id']);
                $table->dropColumn('facebook_id');
            }

            if (Schema::hasColumn('users', 'avatar')) {
                $table->dropColumn('avatar');
            }
        });
    }
};
