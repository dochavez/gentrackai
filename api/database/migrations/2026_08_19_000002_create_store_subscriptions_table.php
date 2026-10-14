<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Entitlements bought through a mobile store (StoreKit / Play Billing) via
     * RevenueCat, rather than through Stripe.
     *
     * App Store guideline 3.1.1 requires digital subscriptions to be sold with
     * In-App Purchase, so iOS purchases never reach Cashier. This table is the
     * second source of truth: `Organization::onPro()` is true when *either* a
     * Cashier subscription or an active row here says so. One row per
     * organization + subscription type ('default' = Pro, 'technician').
     */
    public function up(): void
    {
        Schema::create('store_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->cascadeOnDelete();
            // Mirrors Cashier's subscription "type" so both sources speak the
            // same language: 'default' (Pro) or 'technician'.
            $table->string('type');
            $table->string('store')->default('app_store');
            $table->string('entitlement_id');
            $table->string('product_id')->nullable();
            // null = never expires (a non-renewing/lifetime grant).
            $table->timestamp('expires_at')->nullable();
            // Auto-renew switched off — still entitled until `expires_at`.
            $table->timestamp('canceled_at')->nullable();
            // Store couldn't charge the card; entitlement may lapse at expiry.
            $table->timestamp('billing_issue_at')->nullable();
            $table->string('environment')->default('production');
            // Last RevenueCat event applied, so webhook redelivery is a no-op.
            $table->string('last_event_id')->nullable();
            $table->timestamps();

            $table->unique(['organization_id', 'type']);
            $table->index(['type', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_subscriptions');
    }
};
