<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TechnicianOnboardingRequest;
use App\Http\Resources\UserResource;
use App\Services\TechnicianStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * Turn the caller's active org into a technician provider: create its provider
 * profile and service areas. A payment method is captured separately (setup-mode
 * Checkout) before the panel unlocks.
 *
 * POST /api/technician/onboarding
 */
class TechnicianOnboardingController extends Controller
{
    public function __invoke(TechnicianOnboardingRequest $request, TechnicianStatus $status): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($user->canManageTeam(), 403, 'Only an owner or admin can set up the technician panel.');

        $validated = $request->validated();

        DB::transaction(function () use ($organization, $validated) {
            $profile = $organization->providerProfile()->firstOrNew([]);
            $profile->fill([
                'business_name' => $validated['business_name'],
                'phone' => $validated['phone'] ?? $profile->phone,
                'bio' => $validated['bio'] ?? $profile->bio,
            ]);
            $profile->onboarded_at ??= now();
            $organization->providerProfile()->save($profile);

            // Replace the served states.
            $organization->serviceAreas()->delete();
            $organization->serviceAreas()->createMany(
                collect($validated['service_states'])->map(fn (string $state) => ['state' => $state])->all()
            );
        });

        return response()->json([
            'user' => new UserResource($user->fresh()),
            'technician' => $status->for($user->fresh()),
        ], 201);
    }
}
