<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Give every existing user their own organization (as owner) and attach
     * their generators / tasks / maintenance to it. Raw queries so model hooks
     * and soft-delete scopes don't interfere.
     */
    public function up(): void
    {
        foreach (DB::table('users')->whereNull('organization_id')->get() as $user) {
            $name = trim((string) $user->name) !== '' ? $user->name."'s Team" : 'My Organization';

            $orgId = DB::table('organizations')->insertGetId([
                'name' => $name,
                'owner_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('users')->where('id', $user->id)->update(['organization_id' => $orgId, 'role' => 'owner']);
            DB::table('generators')->where('user_id', $user->id)->update(['organization_id' => $orgId]);
            DB::table('tasks')->where('user_id', $user->id)->update(['organization_id' => $orgId]);
        }

        // Maintenance: inherit the org + creator from its generator.
        foreach (DB::table('generators')->get() as $generator) {
            DB::table('maintenance_items')
                ->where('generator_id', $generator->id)
                ->whereNull('organization_id')
                ->update(['organization_id' => $generator->organization_id, 'user_id' => $generator->user_id]);
        }
    }

    public function down(): void
    {
        // Non-reversible data backfill.
    }
};
