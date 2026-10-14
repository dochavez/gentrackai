<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TechnicianRequestResource;
use App\Models\MaintenanceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The technician's feed of open requests. Deliberately CROSS-TENANT: it reads
 * requests owned by OTHER orgs, matched by the provider's service states — not
 * by the usual same-org scoping.
 */
class TechnicianRequestController extends Controller
{
    /**
     * Open requests in the provider's service states (excluding the provider's
     * own org). The provider's own offer, if any, is surfaced per request.
     *
     * GET /api/technician/requests
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);

        $states = $organization->serviceAreas()->pluck('state');
        $providerOrgId = $organization->id;

        $requests = MaintenanceRequest::query()
            ->where('status', MaintenanceRequest::STATUS_OPEN)
            ->whereIn('state', $states)
            ->where('organization_id', '!=', $providerOrgId) // never your own requests
            ->with([
                'generator',
                'creator',
                // Only the viewer's own offer — competitors' bids stay private.
                'offers' => fn ($q) => $q->where('provider_organization_id', $providerOrgId),
            ])
            ->withCount('offers')
            ->latest()
            ->get();

        return response()->json([
            'requests' => TechnicianRequestResource::collection($requests),
        ]);
    }

    /**
     * A single request visible to this provider (in-feed, offered-on, or won).
     *
     * GET /api/technician/requests/{maintenanceRequest}
     */
    public function show(Request $request, MaintenanceRequest $maintenanceRequest): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);

        $providerOrgId = $organization->id;

        $involved = $maintenanceRequest->provider_organization_id === $providerOrgId
            || $maintenanceRequest->offers()->where('provider_organization_id', $providerOrgId)->exists();

        $inFeed = $maintenanceRequest->status === MaintenanceRequest::STATUS_OPEN
            && $maintenanceRequest->organization_id !== $providerOrgId
            && $organization->serviceAreas()->where('state', $maintenanceRequest->state)->exists();

        abort_unless($involved || $inFeed, 403);

        $maintenanceRequest->load([
            'generator',
            'creator',
            'assignedTechnician',
            'acceptedOffer',
            'review.author',
            'offers' => fn ($q) => $q->where('provider_organization_id', $providerOrgId),
        ])->loadCount('offers');

        return response()->json([
            'request' => new TechnicianRequestResource($maintenanceRequest),
        ]);
    }
}
