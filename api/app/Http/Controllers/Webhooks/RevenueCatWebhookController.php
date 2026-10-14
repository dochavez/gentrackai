<?php

namespace App\Http\Controllers\Webhooks;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Services\StoreEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class RevenueCatWebhookController extends Controller
{
    /**
     * RevenueCat subscription lifecycle events — the authoritative feed for
     * renewals, cancellations and expiries of App Store / Play Store purchases
     * (Stripe has its own Cashier webhook).
     *
     * Authenticated by the shared secret configured as the webhook's
     * Authorization header in the RevenueCat dashboard; RevenueCat does not sign
     * its payloads. Always answers 2xx once authenticated so RevenueCat stops
     * retrying an event we have deliberately ignored.
     *
     * POST /api/webhooks/revenuecat
     */
    public function __invoke(Request $request, StoreEntitlements $entitlements): JsonResponse
    {
        $secret = (string) config('services.revenuecat.webhook_secret');

        if ($secret === '' || ! hash_equals($secret, (string) $request->header('Authorization'))) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        $event = (array) $request->input('event', []);
        $type = (string) Arr::get($event, 'type');
        $eventId = (string) Arr::get($event, 'id');

        // Dashboard "send test event" and events we model no state for.
        if (in_array($type, ['TEST', 'SUBSCRIBER_ALIAS', 'TRANSFER', 'NON_RENEWING_PURCHASE'], true)) {
            return response()->json(['ignored' => $type]);
        }

        $organization = $this->resolveOrganization($event);

        if (! $organization) {
            Log::warning('RevenueCat webhook for an unknown app_user_id', [
                'app_user_id' => Arr::get($event, 'app_user_id'),
                'type' => $type,
            ]);

            return response()->json(['ignored' => 'unknown_subscriber']);
        }

        foreach ((array) Arr::get($event, 'entitlement_ids', []) as $entitlementId) {
            $subscriptionType = $entitlements->typeForEntitlement((string) $entitlementId);

            if (! $subscriptionType) {
                continue; // an entitlement this backend doesn't grant anything for
            }

            $existing = $organization->storeSubscriptions()->where('type', $subscriptionType)->first();

            // Redelivery of an event we already applied.
            if ($existing && $eventId !== '' && $existing->last_event_id === $eventId) {
                continue;
            }

            $expiresAt = $entitlements->toDate(Arr::get($event, 'expiration_at_ms'));

            $entitlements->grant($organization, $subscriptionType, [
                'entitlement_id' => (string) $entitlementId,
                'product_id' => Arr::get($event, 'product_id'),
                'store' => $entitlements->normalizeStore(Arr::get($event, 'store')),
                'environment' => strtolower((string) Arr::get($event, 'environment', 'production')),
                'last_event_id' => $eventId ?: null,
                // EXPIRATION carries a past expiry, which reads as inactive —
                // no separate delete path needed.
                'expires_at' => $expiresAt,
                'canceled_at' => $type === 'CANCELLATION' ? now() : null,
                'billing_issue_at' => $type === 'BILLING_ISSUE' ? now() : null,
            ]);
        }

        return response()->json(['handled' => $type]);
    }

    /**
     * The app identifies itself to RevenueCat as `org_{id}` (see
     * `RevenueCat::appUserId()`); anonymous ids and aliases are ignored.
     *
     * @param  array<string, mixed>  $event
     */
    private function resolveOrganization(array $event): ?Organization
    {
        $candidates = array_merge(
            [Arr::get($event, 'app_user_id')],
            (array) Arr::get($event, 'aliases', []),
            [Arr::get($event, 'original_app_user_id')],
        );

        foreach (array_filter($candidates) as $candidate) {
            if (preg_match('/^org_(\d+)$/', (string) $candidate, $matches)) {
                $organization = Organization::find((int) $matches[1]);

                if ($organization) {
                    return $organization;
                }
            }
        }

        return null;
    }
}
