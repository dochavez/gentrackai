<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Adds the projection state used to make consumption dynamic:
     * a fuel burn rate, a "running since" clock, and per-metric anchor
     * timestamps. run_hours / fuel_level become decimals so partial-hour
     * projection accrues without rounding loss.
     */
    public function up(): void
    {
        Schema::table('generators', function (Blueprint $table) {
            // % of tank burned per running hour (estimate; null = unknown, no fuel projection).
            $table->decimal('fuel_burn_rate', 5, 2)->nullable()->after('fuel_level');
            // When the current running stretch began (null when not running).
            $table->timestamp('running_since')->nullable()->after('fuel_burn_rate');
            // When each metric was last anchored (for "as of" captions).
            $table->timestamp('fuel_reading_at')->nullable()->after('running_since');
            $table->timestamp('run_hours_reading_at')->nullable()->after('fuel_reading_at');
            $table->timestamp('battery_reading_at')->nullable()->after('run_hours_reading_at');

            $table->decimal('run_hours', 10, 1)->default(0)->change();
            $table->decimal('fuel_level', 5, 1)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('generators', function (Blueprint $table) {
            $table->dropColumn([
                'fuel_burn_rate',
                'running_since',
                'fuel_reading_at',
                'run_hours_reading_at',
                'battery_reading_at',
            ]);

            $table->unsignedInteger('run_hours')->default(0)->change();
            $table->unsignedTinyInteger('fuel_level')->nullable()->change();
        });
    }
};
