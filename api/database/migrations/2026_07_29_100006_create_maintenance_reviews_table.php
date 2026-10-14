<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The end-user's review of a completed job. One per request. The provider
     * org is denormalized here so the public provider profile can list reviews
     * without walking every request.
     */
    public function up(): void
    {
        Schema::create('maintenance_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_request_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('provider_organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1–5
            $table->text('comment')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_reviews');
    }
};
