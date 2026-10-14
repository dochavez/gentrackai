<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Insights are per-organization (the fleet is shared), not per-user.
     */
    /**
     * Attach insights to organizations (runs after the organizations table
     * exists). Insights are created without a tenant column, so this only adds
     * one — no dropping of columns/indexes, which avoids MySQL's "index needed
     * in a foreign key constraint" error.
     */
    public function up(): void
    {
        Schema::table('insights', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->unique('organization_id');
        });
    }

    public function down(): void
    {
        Schema::table('insights', function (Blueprint $table) {
            $table->dropUnique(['organization_id']);
            $table->dropConstrainedForeignId('organization_id');
        });
    }
};
