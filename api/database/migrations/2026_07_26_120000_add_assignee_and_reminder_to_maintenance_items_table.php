<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('maintenance_items', function (Blueprint $table) {
            // The team member responsible for the service (mirrors tasks.assignee_id).
            $table->foreignId('assignee_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            // When the "due" reminder last went out, so the daily job never double-notifies.
            $table->timestamp('reminded_at')->nullable()->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('maintenance_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('assignee_id');
            $table->dropColumn('reminded_at');
        });
    }
};
