<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOfferRequest;
use App\Http\Resources\MaintenanceOfferResource;
use App\Models\MaintenanceOffer;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use App\Services\TechnicianGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfferController extends Controller
{
    /**
     * Submit (or update) the provider's price bid on an open request. Gated by
     * the technician subscription / free trial.
     *
     * POST /api/technician/requests/{maintenanceRequest}/offers
     */
    public function store(
        StoreOfferRequest $request,
        MaintenanceRequest $maintenanceRequest,
        TechnicianGate $gate,
        MarketplaceNotifications $notifier,
    ): JsonResponse {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);

        // Can't bid on your own org's request, and only while it's open + in-area.
        abort_if($maintenanceRequest->organization_id === $organization->id, 422, "You can't offer on your own request.");
        abort_unless($maintenanceRequest->isOpen(), 409, 'This request is no longer open.');
        abort_unless(
            $organization->serviceAreas()->where('state', $maintenanceRequest->state)->exists(),
            403,
            "This request isn't in your service area.",
        );

        if (! $gate->canSubmitOffer($organization)) {
            return response()->json([
                'message' => $gate->hasPaymentMethod($organization)
                    ? 'Your free trial is used up. Subscribe to keep taking jobs.'
                    : 'Add a payment method to start taking jobs.',
                'upgradeRequired' => true,
                'feature' => 'technician',
            ], 402);
        }

        // One offer per provider per request — updating an existing pending one edits it.
        $offer = MaintenanceOffer::updateOrCreate(
            [
                'maintenance_request_id' => $maintenanceRequest->id,
                'provider_organization_id' => $organization->id,
            ],
            [
                'user_id' => $user->id,
                'price' => $request->input('price'),
                'message' => $request->input('message'),
                'status' => MaintenanceOffer::STATUS_PENDING,
            ],
        );

        $notifier->offerSubmitted($offer, $maintenanceRequest);

        $offer->load('providerOrganization.providerProfile', 'user');

        return response()->json([
            'offer' => new MaintenanceOfferResource($offer),
        ], 201);
    }

    /**
     * Withdraw the provider's own pending offer (only while the request is open).
     *
     * DELETE /api/technician/offers/{offer}
     */
    public function destroy(Request $request, MaintenanceOffer $offer): JsonResponse
    {
        $user = $request->user();
        abort_unless($offer->provider_organization_id === $user->organization_id, 403);
        abort_unless($offer->status === MaintenanceOffer::STATUS_PENDING, 409, 'This offer can no longer be withdrawn.');

        $offer->update(['status' => MaintenanceOffer::STATUS_WITHDRAWN]);

        return response()->json(null, 204);
    }
}
