<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generators', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('manufacturer')->nullable();
            $table->string('model_number')->nullable();
            $table->string('rated_power')->nullable();
            $table->string('fuel_type')->nullable();
            $table->string('type')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('transfer_switch')->nullable();
            $table->string('service_interval')->nullable();
            $table->string('location')->nullable();
            $table->string('status')->default('running');
            $table->unsignedInteger('run_hours')->default(0);
            $table->unsignedTinyInteger('fuel_level')->nullable();
            $table->decimal('battery_voltage', 4, 1)->nullable();
            $table->date('installed_at')->nullable();
            $table->string('image_path')->nullable();
            $table->unsignedTinyInteger('confidence')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generators');
    }
};
