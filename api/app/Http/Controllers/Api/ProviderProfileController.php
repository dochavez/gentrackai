<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProviderProfileResource;
use App\Models\Organization;
use Illuminate\Http\JsonResponse;

class ProviderProfileController extends Controller
{
    /**
     * A technician provider's public profile (identity, rating, recent reviews).
     *
     * GET /api/providers/{organization}/profile
     */
    public function show(Organization $organization): JsonResponse
    {
        $profile = $organization->providerProfile;
        abort_if($profile === null, 404);

        $profile->load(['organization.serviceAreas', 'reviews' => fn ($q) => $q->with('author')->limit(20)]);

        return response()->json([
            'profile' => new ProviderProfileResource($profile),
        ]);
    }
}
