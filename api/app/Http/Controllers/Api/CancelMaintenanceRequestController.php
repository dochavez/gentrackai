<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MaintenanceRequestResource;
use App\Models\MaintenanceOffer;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cancel a request before the visit is scheduled. Outstanding offers are
 * rejected and the providers who bid are notified.
 *
 * POST /api/maintenance-requests/{maintenanceRequest}/cancel
 */
class CancelMaintenanceRequestController extends Controller
{
    public function __invoke(
        Request $request,
        MaintenanceRequest $maintenanceRequest,
        MarketplaceNotifications $notifier,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($maintenanceRequest->organization_id === $user->organization_id, 403);
        abort_unless($user->canManageTeam() || $maintenanceRequest->created_by === $user->id, 403);
        abort_unless(in_array($maintenanceRequest->status, [
            MaintenanceRequest::STATUS_OPEN,
            MaintenanceRequest::STATUS_ACCEPTED,
        ], true), 409, 'This request can no longer be cancelled.');

        $notifier->cancelled($maintenanceRequest);

        $maintenanceRequest->offers()
            ->where('status', MaintenanceOffer::STATUS_PENDING)
            ->update(['status' => MaintenanceOffer::STATUS_REJECTED]);

        $maintenanceRequest->markCancelled();
        $maintenanceRequest->save();

        $maintenanceRequest->load(['generator', 'review'])->loadCount('offers');

        return response()->json([
            'request' => new MaintenanceRequestResource($maintenanceRequest),
        ]);
    }
}
