<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The US states a provider serves. A maintenance request is matched to
     * providers whose service areas include the requester's state (no geo).
     */
    public function up(): void
    {
        Schema::create('provider_service_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('state', 2)->index();
            $table->timestamps();

            $table->unique(['provider_organization_id', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_service_areas');
    }
};
