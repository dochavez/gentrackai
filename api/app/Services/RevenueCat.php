<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Read-side client for RevenueCat, which fronts StoreKit / Play Billing.
 *
 * The app buys through the store SDK; RevenueCat then tells *us* what the
 * customer owns. Two paths feed `StoreEntitlements`:
 *   - this class, called right after a purchase (`/billing/iap/sync`), because
 *     the webhook can land a beat after the app returns; and
 *   - the webhook itself, for renewals, cancellations and expiries.
 *
 * The RevenueCat "app user id" is the organization, not the user: Cashier
 * subscriptions live on the org too, so both channels grant the same thing.
 */
class RevenueCat
{
    private const BASE_URL = 'https://api.revenuecat.com/v1';

    /** The org's RevenueCat app user id — the app must `logIn()` with this. */
    public function appUserId(Organization $organization): string
    {
        return 'org_'.$organization->id;
    }

    public function configured(): bool
    {
        return filled(config('services.revenuecat.secret_key'));
    }

    /**
     * The org's current entitlements, keyed by RevenueCat entitlement id.
     * Only unexpired entitlements are returned.
     *
     * @return array<string, array<string, mixed>>|null null when the lookup fails
     */
    public function entitlements(Organization $organization): ?array
    {
        if (! $this->configured()) {
            return null;
        }

        try {
            $response = Http::withToken((string) config('services.revenuecat.secret_key'))
                ->timeout(10)
                ->get(self::BASE_URL.'/subscribers/'.urlencode($this->appUserId($organization)))
                ->throw();
        } catch (Throwable $e) {
            Log::warning('RevenueCat subscriber lookup failed', [
                'organization_id' => $organization->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }

        $entitlements = $response->json('subscriber.entitlements') ?? [];

        return collect($entitlements)
            ->filter(fn (array $entitlement) => $this->isUnexpired($entitlement))
            ->all();
    }

    /** @param array<string, mixed> $entitlement */
    private function isUnexpired(array $entitlement): bool
    {
        $expires = $entitlement['expires_date'] ?? null;

        return $expires === null || now()->lt($expires);
    }
}
