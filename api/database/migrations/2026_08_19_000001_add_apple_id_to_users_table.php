<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the stable Apple user identifier (`sub` from the identity token) so
     * Sign in with Apple can be offered alongside Google — required by App
     * Store guideline 4.8. Apple never reissues this value, and it is the only
     * dependable key for returning users (the email claim can be a private
     * relay address, or absent on later sign-ins).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('apple_id')->nullable()->unique()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['apple_id']);
            $table->dropColumn('apple_id');
        });
    }
};
