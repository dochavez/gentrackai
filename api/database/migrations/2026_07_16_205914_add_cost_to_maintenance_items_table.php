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
            $table->decimal('cost', 10, 2)->nullable()->after('detail');
            $table->decimal('est_saved', 10, 2)->nullable()->after('cost');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_items', function (Blueprint $table) {
            $table->dropColumn(['cost', 'est_saved']);
        });
    }
};
