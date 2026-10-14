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
        Schema::table('maintenance_items', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('generator_id')->constrained()->cascadeOnDelete();
            // Who scheduled it (for "his maintenances" scoping).
            $table->foreignId('user_id')->nullable()->after('organization_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('organization_id');
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
