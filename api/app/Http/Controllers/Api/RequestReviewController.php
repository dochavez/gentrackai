<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Nudge the customer to leave a review on a completed job.
 *
 * POST /api/technician/jobs/{maintenanceRequest}/request-review
 */
class RequestReviewController extends Controller
{
    public function __invoke(
        Request $request,
        MaintenanceRequest $maintenanceRequest,
        MarketplaceNotifications $notifier,
    ): JsonResponse {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);
        abort_unless($maintenanceRequest->provider_organization_id === $organization->id, 403);
        abort_unless(
            $user->canManageTeam() || $maintenanceRequest->assigned_technician_id === $user->id,
            403,
        );
        abort_unless($maintenanceRequest->status === MaintenanceRequest::STATUS_COMPLETED, 409, 'You can only request a review on a completed job.');
        abort_if($maintenanceRequest->review()->exists(), 409, 'This job has already been reviewed.');

        $notifier->reviewRequested($maintenanceRequest);

        return response()->json(['message' => 'Review requested.']);
    }
}
