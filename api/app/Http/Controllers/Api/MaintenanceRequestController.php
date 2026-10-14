<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaintenanceRequestRequest;
use App\Http\Resources\MaintenanceRequestResource;
use App\Models\MaintenanceRequest;
use App\Services\MarketplaceNotifications;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The customer (end-user) side of the maintenance marketplace: create a
 * request, list your requests, and view one with its offers.
 */
class MaintenanceRequestController extends Controller
{
    /**
     * The caller org's marketplace requests. Members see the ones they filed;
     * owner/admin see all of the org's requests (mirrors MaintenanceController).
     *
     * GET /api/maintenance-requests
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = MaintenanceRequest::query()
            ->where('organization_id', $user->organization_id)
            ->when(! $user->canManageTeam(), fn ($q) => $q->where('created_by', $user->id))
            ->with(['generator', 'providerOrganization.providerProfile', 'acceptedOffer', 'assignedTechnician', 'review'])
            ->withCount('offers')
            ->latest()
            ->get();

        return response()->json([
            'requests' => MaintenanceRequestResource::collection($requests),
        ]);
    }

    /**
     * File a new maintenance request. Requires a service address (the `state`
     * is snapshotted onto the request and drives area matching).
     *
     * POST /api/maintenance-requests
     */
    public function store(StoreMaintenanceRequestRequest $request, MarketplaceNotifications $notifier): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAddress(), 422, 'Add your service address before requesting a maintenance.');

        // created_by drives the booted() snapshot of organization_id + state.
        $maintenanceRequest = MaintenanceRequest::create($request->validated() + [
            'created_by' => $user->id,
            'status' => MaintenanceRequest::STATUS_OPEN,
        ]);

        $notifier->requestBroadcast($maintenanceRequest);

        $maintenanceRequest->load(['generator', 'review'])->loadCount('offers');

        return response()->json([
            'request' => new MaintenanceRequestResource($maintenanceRequest),
        ], 201);
    }

    /**
     * A single request with its offers, for the customer to choose from.
     *
     * GET /api/maintenance-requests/{maintenanceRequest}
     */
    public function show(Request $request, MaintenanceRequest $maintenanceRequest): JsonResponse
    {
        $user = $request->user();
        abort_unless($maintenanceRequest->organization_id === $user->organization_id, 403);
        abort_unless($user->canManageTeam() || $maintenanceRequest->created_by === $user->id, 403);

        $maintenanceRequest->load([
            'generator',
            'offers.providerOrganization.providerProfile',
            'offers.user',
            'providerOrganization.providerProfile',
            'acceptedOffer',
            'assignedTechnician',
            'review.author',
        ])->loadCount('offers');

        return response()->json([
            'request' => new MaintenanceRequestResource($maintenanceRequest),
        ]);
    }
}
