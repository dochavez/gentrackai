<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A marketplace maintenance request: an end-user org asks external
     * technicians to service a generator. Distinct from the internal
     * per-generator `maintenance_items` log.
     */
    public function up(): void
    {
        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();
            // The requesting (customer) org and who created it.
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignId('generator_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            // Snapshotted from the creating user at store time — drives area matching.
            $table->string('state', 2)->index();
            $table->text('detail')->nullable();
            // open → accepted → scheduled → completed (+ cancelled). See MaintenanceRequest.
            $table->string('status')->default('open')->index();
            // Filled once an offer is accepted.
            $table->foreignId('provider_organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            // App-maintained pointer (no FK — avoids a requests↔offers circular FK on SQLite).
            $table->unsignedBigInteger('accepted_offer_id')->nullable();
            // The provider-org member carrying out the job (solo: auto; company: assigned).
            $table->foreignId('assigned_technician_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // The technician feed reads open requests by state.
            $table->index(['state', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
    }
};
