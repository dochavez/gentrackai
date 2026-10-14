<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaintenanceReviewRequest;
use App\Http\Resources\MaintenanceRequestResource;
use App\Models\MaintenanceRequest;
use App\Models\MaintenanceReview;
use App\Services\MarketplaceNotifications;
use Illuminate\Http\JsonResponse;

/**
 * The customer leaves a review on a completed job (one per request). Updates
 * the provider's rating aggregates and notifies the technician.
 *
 * POST /api/maintenance-requests/{maintenanceRequest}/review
 */
class StoreMaintenanceReviewController extends Controller
{
    public function __invoke(
        StoreMaintenanceReviewRequest $request,
        MaintenanceRequest $maintenanceRequest,
        MarketplaceNotifications $notifier,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($maintenanceRequest->organization_id === $user->organization_id, 403);
        abort_unless($user->canManageTeam() || $maintenanceRequest->created_by === $user->id, 403);
        abort_unless($maintenanceRequest->status === MaintenanceRequest::STATUS_COMPLETED, 409, 'You can only review a completed job.');
        abort_if($maintenanceRequest->review()->exists(), 409, 'This job has already been reviewed.');

        $review = $maintenanceRequest->review()->create([
            'provider_organization_id' => $maintenanceRequest->provider_organization_id,
            'rating' => $request->integer('rating'),
            'comment' => $request->input('comment'),
            'created_by' => $user->id,
        ]);

        $this->recomputeProviderRating($maintenanceRequest);
        $notifier->reviewLeft($review, $maintenanceRequest);

        $maintenanceRequest->load([
            'generator',
            'providerOrganization.providerProfile',
            'acceptedOffer',
            'assignedTechnician',
            'review.author',
        ])->loadCount('offers');

        return response()->json([
            'request' => new MaintenanceRequestResource($maintenanceRequest),
        ]);
    }

    /** Roll the provider's denormalized rating_avg / ratings_count. */
    private function recomputeProviderRating(MaintenanceRequest $maintenanceRequest): void
    {
        $profile = $maintenanceRequest->providerOrganization?->providerProfile;
        if ($profile === null) {
            return;
        }

        $agg = MaintenanceReview::where('provider_organization_id', $maintenanceRequest->provider_organization_id)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        $profile->update([
            'rating_avg' => $agg->avg_rating !== null ? round((float) $agg->avg_rating, 2) : null,
            'ratings_count' => (int) $agg->total,
        ]);
    }
}
