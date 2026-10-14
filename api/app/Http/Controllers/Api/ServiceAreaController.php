<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateServiceAreasRequest;
use App\Services\TechnicianStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ServiceAreaController extends Controller
{
    /**
     * Replace the provider org's served states.
     *
     * PUT /api/technician/service-areas
     */
    public function update(UpdateServiceAreasRequest $request, TechnicianStatus $status): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($organization->isProvider(), 403);
        abort_unless($user->canManageTeam(), 403, 'Only an owner or admin can change service areas.');

        DB::transaction(function () use ($organization, $request) {
            $organization->serviceAreas()->delete();
            $organization->serviceAreas()->createMany(
                collect($request->validated()['service_states'])->map(fn (string $state) => ['state' => $state])->all()
            );
        });

        return response()->json([
            'technician' => $status->for($user->fresh()),
        ]);
    }
}
