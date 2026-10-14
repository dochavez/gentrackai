<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Move from single-org-per-user to many-to-many membership.
 *
 * Before: `users.organization_id` + `users.role` (one org per user).
 * After:  an `organization_user` pivot (a role per membership) plus a
 *         `users.current_organization_id` pointer for the *active* org.
 *
 * Tenant records keep their denormalized `organization_id` — only the
 * user↔organization relationship becomes many-to-many.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('member'); // owner | admin | member
            $table->timestamps();

            $table->unique(['organization_id', 'user_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('current_organization_id')
                ->nullable()
                ->after('id')
                ->constrained('organizations')
                ->nullOnDelete();
        });

        // Backfill: each user's single org becomes a membership + their active org.
        foreach (DB::table('users')->whereNotNull('organization_id')->orderBy('id')->get() as $user) {
            DB::table('organization_user')->insertOrIgnore([
                'organization_id' => $user->organization_id,
                'user_id' => $user->id,
                'role' => $user->role ?? 'member',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('users')->where('id', $user->id)
                ->update(['current_organization_id' => $user->organization_id]);
        }

        // Drop the FK before the column (in its own statement so SQLite's
        // table rebuild doesn't keep a constraint pointing at a dropped column).
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['organization_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')
                ->constrained()->nullOnDelete();
            $table->string('role')->nullable()->after('organization_id');
        });

        // Restore the flat columns from the active org + its pivot role.
        foreach (DB::table('users')->whereNotNull('current_organization_id')->orderBy('id')->get() as $user) {
            $role = DB::table('organization_user')
                ->where('user_id', $user->id)
                ->where('organization_id', $user->current_organization_id)
                ->value('role');

            DB::table('users')->where('id', $user->id)->update([
                'organization_id' => $user->current_organization_id,
                'role' => $role ?? 'owner',
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['current_organization_id']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('current_organization_id');
        });

        Schema::dropIfExists('organization_user');
    }
};
