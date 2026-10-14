<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An entitlement bought through the App Store / Play Store (via RevenueCat)
 * instead of Stripe — see the migration for why both exist.
 *
 * `expires_at` is the store's own expiry as RevenueCat reports it, which
 * already accounts for grace periods and billing retry, so "is this org
 * entitled right now?" is a plain expiry check.
 */
class StoreSubscription extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'type',
        'store',
        'entitlement_id',
        'product_id',
        'expires_at',
        'canceled_at',
        'billing_issue_at',
        'environment',
        'last_event_id',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'canceled_at' => 'datetime',
            'billing_issue_at' => 'datetime',
        ];
    }

    /** Entitled right now? A null expiry means a non-expiring grant. */
    public function isActive(): bool
    {
        return $this->expires_at === null || $this->expires_at->isFuture();
    }

    /**
     * @param  Builder<StoreSubscription>  $query
     * @return Builder<StoreSubscription>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
        });
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
