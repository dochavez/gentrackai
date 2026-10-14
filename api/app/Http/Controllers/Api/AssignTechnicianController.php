<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignTechnicianRequest;
use App\Http\Resources\TechnicianRequestResource;
use App\Models\MaintenanceRequest;
use Illuminate\Http\JsonResponse;

/**
 * A company owner/admin assigns one of its members to a won job.
 *
 * POST /api/technician/jobs/{maintenanceRequest}/assign
 */
class AssignTechnicianController extends Controller
{
    public function __invoke(AssignTechnicianRequest $request, MaintenanceRequest $maintenanceRequest): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);
        abort_unless($maintenanceRequest->provider_organization_id === $organization->id, 403);
        abort_unless($user->canManageTeam(), 403, 'Only an owner or admin can assign a technician.');
        abort_unless(in_array($maintenanceRequest->status, [
            MaintenanceRequest::STATUS_ACCEPTED,
            MaintenanceRequest::STATUS_SCHEDULED,
        ], true), 409, 'This job can no longer be reassigned.');

        $maintenanceRequest->assigned_technician_id = $request->integer('technician_id');
        $maintenanceRequest->save();

        $maintenanceRequest->load(['generator', 'creator', 'assignedTechnician', 'acceptedOffer', 'review.author']);

        return response()->json([
            'job' => new TechnicianRequestResource($maintenanceRequest),
        ]);
    }
}
