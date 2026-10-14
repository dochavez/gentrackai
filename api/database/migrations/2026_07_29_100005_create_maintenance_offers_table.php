<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A technician provider's price bid on a maintenance request. One offer
     * per provider per request (they can withdraw and it stays as history).
     */
    public function up(): void
    {
        Schema::create('maintenance_offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('provider_organization_id')->constrained('organizations')->cascadeOnDelete();
            // The provider-org member who submitted the offer.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('price', 10, 2);
            $table->text('message')->nullable();
            // pending → accepted | rejected | withdrawn.
            $table->string('status')->default('pending');
            $table->timestamps();

            // Explicit (short) name — the auto-generated one exceeds MySQL's 64-char limit.
            $table->unique(['maintenance_request_id', 'provider_organization_id'], 'maintenance_offers_request_provider_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_offers');
    }
};
