<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Append-only log of usage readings for a generator. Each row anchors one
     * metric (fuel %, run hours, or battery volts) to a point in time; the
     * backend projects the live value forward from the latest anchor.
     */
    public function up(): void
    {
        Schema::create('generator_readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generator_id')->constrained()->cascadeOnDelete();
            $table->string('metric'); // fuel | run_hours | battery
            $table->decimal('value', 10, 2);
            $table->string('note')->nullable();
            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['generator_id', 'metric', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generator_readings');
    }
};
