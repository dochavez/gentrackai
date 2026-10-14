<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StoreEntitlements;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SyncStoreSubscriptionController extends Controller
{
    /**
     * Re-read the org's In-App Purchase entitlements from RevenueCat and apply
     * them locally.
     *
     * The app calls this immediately after a StoreKit purchase completes: the
     * RevenueCat webhook is authoritative but can arrive a moment later, and the
     * user expects Pro to be unlocked by the time the sheet closes. Never trusts
     * anything client-supplied — the entitlements come from RevenueCat's API.
     *
     * POST /api/billing/iap/sync
     */
    public function __invoke(Request $request, StoreEntitlements $entitlements): JsonResponse
    {
        $organization = $request->user()->organization;

        $synced = $entitlements->sync($organization);

        // A failed lookup is not the client's fault, and the webhook will still
        // land — report it without failing the purchase flow.
        return response()->json([
            'synced' => $synced,
            'plan' => $organization->fresh()->planKey(),
        ], $synced ? 200 : 202);
    }
}
