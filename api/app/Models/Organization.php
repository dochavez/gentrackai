<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Cashier\Billable;

class Organization extends Model
{
    use Billable;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'owner_id',
    ];

    /**
     * Cached per-instance answers for the store-entitlement lookup, which is
     * queried repeatedly per request (UserResource, PlanGate, gates).
     *
     * @var array<string, bool>
     */
    private array $storeEntitlementCache = [];

    /**
     * Whether the org has an active Pro subscription — from Stripe (web/Android)
     * or from an App Store / Play Store purchase (iOS must use In-App Purchase
     * per App Store guideline 3.1.1, so those never reach Cashier).
     */
    public function onPro(): bool
    {
        return $this->subscribed('default') || $this->hasStoreSubscription('default');
    }

    /** Whether the org has an active technician-panel subscription (separate from Pro). */
    public function onTechnicianPlan(): bool
    {
        return $this->subscribed('technician') || $this->hasStoreSubscription('technician');
    }

    /** Whether an unexpired store (IAP) entitlement of this type exists. */
    public function hasStoreSubscription(string $type): bool
    {
        return $this->storeEntitlementCache[$type] ??= $this->storeSubscriptions()
            ->where('type', $type)
            ->active()
            ->exists();
    }

    /**
     * Which channel is paying for this subscription type, for the app to render
     * the right "manage subscription" action: Apple/Google manage their own
     * subscriptions, Stripe uses the billing portal.
     */
    public function subscriptionSource(string $type): ?string
    {
        if ($this->subscribed($type)) {
            return 'stripe';
        }

        return $this->storeSubscriptions()->where('type', $type)->active()->value('store');
    }

    /** Whether this org is a technician provider (a provider profile exists). */
    public function isProvider(): bool
    {
        return $this->providerProfile()->exists();
    }

    /** The org's plan key: 'pro' when subscribed, else 'free'. */
    public function planKey(): string
    {
        return $this->onPro() ? 'pro' : 'free';
    }

    /**
     * The org's entitlements from config/plans.php (a `null` limit = unlimited).
     *
     * @return array<string, mixed>
     */
    public function planLimits(): array
    {
        return config('plans.'.$this->planKey());
    }

    /** Stripe receipts go to the org owner (an Organization has no email of its own). */
    public function stripeEmail(): ?string
    {
        return $this->owner?->email;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * Entitlements bought through the App Store / Play Store (via RevenueCat).
     *
     * @return HasMany<StoreSubscription, $this>
     */
    public function storeSubscriptions(): HasMany
    {
        return $this->hasMany(StoreSubscription::class);
    }

    /**
     * @return HasMany<Generator, $this>
     */
    public function generators(): HasMany
    {
        return $this->hasMany(Generator::class);
    }

    /**
     * @return HasMany<Task, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * @return HasMany<Invitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    /**
     * @return HasOne<Insight, $this>
     */
    public function insight(): HasOne
    {
        return $this->hasOne(Insight::class);
    }

    /**
     * Provider profile — present iff this org is a technician provider.
     *
     * @return HasOne<ProviderProfile, $this>
     */
    public function providerProfile(): HasOne
    {
        return $this->hasOne(ProviderProfile::class);
    }

    /**
     * The US states this provider serves.
     *
     * @return HasMany<ProviderServiceArea, $this>
     */
    public function serviceAreas(): HasMany
    {
        return $this->hasMany(ProviderServiceArea::class, 'provider_organization_id');
    }

    /**
     * Marketplace requests this (customer) org has created.
     *
     * @return HasMany<MaintenanceRequest, $this>
     */
    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class);
    }

    /**
     * Marketplace jobs this (provider) org has won.
     *
     * @return HasMany<MaintenanceRequest, $this>
     */
    public function providerJobs(): HasMany
    {
        return $this->hasMany(MaintenanceRequest::class, 'provider_organization_id');
    }
}
