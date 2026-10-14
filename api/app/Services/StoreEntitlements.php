<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\StoreSubscription;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;

/**
 * Writes store (In-App Purchase) entitlements onto an organization.
 *
 * Both inputs — the post-purchase sync (`RevenueCat::entitlements()`) and the
 * RevenueCat webhook — funnel through here so there is exactly one place that
 * decides what an organization owns. Every operation is idempotent: replaying
 * the same event or syncing twice produces the same row.
 */
class StoreEntitlements
{
    public function __construct(private RevenueCat $revenueCat) {}

    /**
     * Our subscription types mapped to their RevenueCat entitlement ids
     * ('default' = Pro, 'technician' = the technician panel).
     *
     * @return array<string, string>
     */
    public function map(): array
    {
        return array_filter((array) config('plans.iap.entitlements'));
    }

    /** The subscription type a RevenueCat entitlement id grants, if any. */
    public function typeForEntitlement(string $entitlementId): ?string
    {
        return array_search($entitlementId, $this->map(), strict: true) ?: null;
    }

    /**
     * Pull the org's entitlements from RevenueCat and make the local rows match.
     * Called right after a purchase completes in the app.
     *
     * @return bool whether RevenueCat could be reached (false = left untouched)
     */
    public function sync(Organization $organization): bool
    {
        $entitlements = $this->revenueCat->entitlements($organization);

        if ($entitlements === null) {
            return false;
        }

        foreach ($this->map() as $type => $entitlementId) {
            $entitlement = $entitlements[$entitlementId] ?? null;

            if (! $entitlement) {
                // No longer owned (or never was) — drop any stale row.
                $organization->storeSubscriptions()->where('type', $type)->delete();

                continue;
            }

            $this->grant($organization, $type, [
                'entitlement_id' => $entitlementId,
                'product_id' => Arr::get($entitlement, 'product_identifier'),
                'store' => $this->normalizeStore(Arr::get($entitlement, 'store')),
                'expires_at' => $this->toDate(Arr::get($entitlement, 'expires_date')),
            ]);
        }

        return true;
    }

    /**
     * Upsert one entitlement row.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function grant(Organization $organization, string $type, array $attributes): StoreSubscription
    {
        /** @var StoreSubscription $subscription */
        $subscription = $organization->storeSubscriptions()->updateOrCreate(
            ['type' => $type],
            array_filter([
                'entitlement_id' => $attributes['entitlement_id'] ?? null,
                'product_id' => $attributes['product_id'] ?? null,
                'store' => $attributes['store'] ?? 'app_store',
                'environment' => $attributes['environment'] ?? 'production',
                'last_event_id' => $attributes['last_event_id'] ?? null,
            ], fn ($value) => $value !== null) + [
                // Nullable-by-design columns are set explicitly: a renewal must
                // be able to clear a previous cancellation / billing issue.
                'expires_at' => $attributes['expires_at'] ?? null,
                'canceled_at' => $attributes['canceled_at'] ?? null,
                'billing_issue_at' => $attributes['billing_issue_at'] ?? null,
            ],
        );

        return $subscription;
    }

    /** RevenueCat reports stores as `APP_STORE`; we persist `app_store`. */
    public function normalizeStore(?string $store): string
    {
        return $store ? strtolower($store) : 'app_store';
    }

    public function toDate(int|string|null $value): ?CarbonImmutable
    {
        if ($value === null) {
            return null;
        }

        // Webhooks carry epoch milliseconds; the REST API carries ISO-8601.
        $date = is_int($value)
            ? CarbonImmutable::createFromTimestampMs($value)
            : CarbonImmutable::parse($value);

        // Both arrive as UTC. Eloquent persists a timestamp using the wall-clock
        // time of whatever zone the instance carries, and SQL compares it against
        // the app's `now()` — so a UTC value would sit hours off and an expiry
        // could read as still active. Convert to the app timezone before storing.
        return $date->setTimezone(config('app.timezone'));
    }
}
