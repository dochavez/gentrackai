<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stores the Apple refresh token obtained by exchanging the authorization
     * code from the native sign-in. App Store guideline 5.1.1(v) requires apps
     * that offer Sign in with Apple to revoke the user's Apple grant (via
     * Apple's REST API) when the account is deleted — this token is what that
     * call needs. Encrypted at rest by the `encrypted` cast on User, hence
     * `text` rather than `string`.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('apple_refresh_token')->nullable()->after('apple_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('apple_refresh_token');
        });
    }
};
