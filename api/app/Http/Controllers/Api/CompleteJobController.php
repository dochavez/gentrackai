<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TechnicianRequestResource;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Mark a scheduled job complete. Consumes a trial slot (increments the
 * provider's jobs_completed) and mirrors the work into the customer's internal
 * maintenance log so it shows in the generator's history.
 *
 * PATCH /api/technician/jobs/{maintenanceRequest}/complete
 */
class CompleteJobController extends Controller
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
        abort_unless($maintenanceRequest->status === MaintenanceRequest::STATUS_SCHEDULED, 409, 'This job is not in progress.');

        DB::transaction(function () use ($maintenanceRequest, $organization) {
            $maintenanceRequest->markCompleted();
            $maintenanceRequest->save();

            // Trial accounting — one completion == one slot consumed.
            $organization->providerProfile?->increment('jobs_completed');

            // Mirror into the customer's generator history (optional continuity).
            $generator = $maintenanceRequest->generator;
            if ($generator !== null) {
                $generator->maintenanceItems()->create([
                    'user_id' => $maintenanceRequest->created_by,
                    'title' => 'External maintenance',
                    'detail' => $maintenanceRequest->detail,
                    'cost' => $maintenanceRequest->acceptedOffer?->price,
                    'completed_at' => now(),
                ]);
            }
        });

        $notifier->reviewRequested($maintenanceRequest);

        $maintenanceRequest->load(['generator', 'creator', 'assignedTechnician', 'acceptedOffer', 'review.author']);

        return response()->json([
            'job' => new TechnicianRequestResource($maintenanceRequest),
        ]);
    }
}
