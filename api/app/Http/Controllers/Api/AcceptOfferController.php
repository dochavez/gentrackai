<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaintenanceRequestResource;
use App\Models\MaintenanceOffer;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use App\Services\TechnicianGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * The customer accepts one offer. A solo provider is auto-assigned its
 * technician; a company assigns one afterwards. Sibling offers are rejected.
 *
 * POST /api/maintenance-requests/{maintenanceRequest}/offers/{offer}/accept
 */
class AcceptOfferController extends Controller
{
    public function __invoke(
        Request $request,
        MaintenanceRequest $maintenanceRequest,
        MaintenanceOffer $offer,
        TechnicianGate $gate,
        MarketplaceNotifications $notifier,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($maintenanceRequest->organization_id === $user->organization_id, 403);
        abort_unless($user->canManageTeam() || $maintenanceRequest->created_by === $user->id, 403);
        abort_unless($offer->maintenance_request_id === $maintenanceRequest->id, 404);

        // If the provider lapsed since offering, drop this offer so the customer
        // picks another (done outside the accept transaction so it persists).
        $provider = $offer->providerOrganization;
        if (! $gate->canWinJob($provider)) {
            $offer->update(['status' => MaintenanceOffer::STATUS_REJECTED]);

            return response()->json([
                'message' => 'That technician is no longer available. Please choose another offer.',
            ], 409);
        }

        // Solo provider (1 member) is auto-assigned; a company assigns later.
        $assignedTechnicianId = $provider->members()->count() <= 1 ? $offer->user_id : null;

        $accepted = DB::transaction(function () use ($maintenanceRequest, $offer, $assignedTechnicianId) {
            // Serialize concurrent accepts on the same request.
            $fresh = MaintenanceRequest::whereKey($maintenanceRequest->id)->lockForUpdate()->first();
            abort_unless($fresh->isOpen(), 409, 'This request is no longer open.');
            abort_unless($offer->fresh()->status === MaintenanceOffer::STATUS_PENDING, 409, 'That offer is no longer available.');

            $fresh->markAccepted($offer, $assignedTechnicianId);
            $fresh->save();

            $offer->update(['status' => MaintenanceOffer::STATUS_ACCEPTED]);
            $fresh->offers()
                ->where('id', '!=', $offer->id)
                ->where('status', MaintenanceOffer::STATUS_PENDING)
                ->update(['status' => MaintenanceOffer::STATUS_REJECTED]);

            return $fresh;
        });

        $notifier->offerAccepted($offer);

        $accepted->load([
            'generator',
            'offers.providerOrganization.providerProfile',
            'offers.user',
            'providerOrganization.providerProfile',
            'acceptedOffer',
            'assignedTechnician',
            'review.author',
        ])->loadCount('offers');

        return response()->json([
            'request' => new MaintenanceRequestResource($accepted),
        ]);
    }
}
