<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Email verification is being introduced now, so grandfather every existing
     * user as verified — they predate the requirement and shouldn't be locked
     * out. Only NEW email/password signups will need to verify.
     */
    public function up(): void
    {
        DB::table('users')->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // No-op: we can't know which users were unverified before this ran.
    }
};
