<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A provider profile turns an organization into a technician provider
     * (a solo technician's own org, or a technician company). Its mere
     * existence == "this org is a provider" (Organization::isProvider()).
     */
    public function up(): void
    {
        Schema::create('provider_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('business_name')->nullable();
            $table->string('phone')->nullable();
            $table->text('bio')->nullable();
            // Denormalized rating aggregates, recomputed when a review lands.
            $table->decimal('rating_avg', 3, 2)->nullable();
            $table->unsignedInteger('ratings_count')->default(0);
            // Completed marketplace jobs — powers the usage-based free trial.
            $table->unsignedInteger('jobs_completed')->default(0);
            // A payment method has been captured (setup-mode Checkout completed).
            $table->boolean('payment_ready')->default(false);
            $table->timestamp('onboarded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_profiles');
    }
};
