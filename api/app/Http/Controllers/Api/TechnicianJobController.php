<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TechnicianRequestResource;
use App\Models\MaintenanceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Jobs the provider has won. Members see the jobs assigned to them; owner/admin
 * see all of the provider org's jobs (mirrors MaintenanceController visibility).
 */
class TechnicianJobController extends Controller
{
    /**
     * GET /api/technician/jobs
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);

        $jobs = MaintenanceRequest::query()
            ->where('provider_organization_id', $organization->id)
            ->when(! $user->canManageTeam(), fn ($q) => $q->where('assigned_technician_id', $user->id))
            ->with(['generator', 'creator', 'assignedTechnician', 'acceptedOffer', 'review.author'])
            ->latest()
            ->get();

        return response()->json([
            'jobs' => TechnicianRequestResource::collection($jobs),
        ]);
    }

    /**
     * GET /api/technician/jobs/{maintenanceRequest}
     */
    public function show(Request $request, MaintenanceRequest $maintenanceRequest): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);
        abort_unless($maintenanceRequest->provider_organization_id === $organization->id, 403);
        abort_unless(
            $user->canManageTeam() || $maintenanceRequest->assigned_technician_id === $user->id,
            403,
        );

        $maintenanceRequest->load(['generator', 'creator', 'assignedTechnician', 'acceptedOffer', 'review.author']);

        return response()->json([
            'job' => new TechnicianRequestResource($maintenanceRequest),
        ]);
    }
}
