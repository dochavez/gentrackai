<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ScheduleJobRequest;
use App\Http\Resources\TechnicianRequestResource;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use Illuminate\Http\JsonResponse;

/**
 * Schedule the visit for a won job. Requires an assigned technician (a company
 * must assign one first; solo providers are auto-assigned on acceptance).
 *
 * PATCH /api/technician/jobs/{maintenanceRequest}/schedule
 */
class ScheduleJobController extends Controller
{
    public function __invoke(
        ScheduleJobRequest $request,
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
        abort_unless($maintenanceRequest->status === MaintenanceRequest::STATUS_ACCEPTED, 409, 'This job is not ready to schedule.');
        abort_if($maintenanceRequest->assigned_technician_id === null, 409, 'Assign a technician before scheduling.');

        $maintenanceRequest->markScheduled($request->date('scheduled_at'));
        $maintenanceRequest->save();

        $notifier->scheduled($maintenanceRequest);

        $maintenanceRequest->load(['generator', 'creator', 'assignedTechnician', 'acceptedOffer', 'review.author']);

        return response()->json([
            'job' => new TechnicianRequestResource($maintenanceRequest),
        ]);
    }
}
