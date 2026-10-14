<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateTechnicianProfileRequest;
use App\Services\TechnicianStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Edit the provider's public profile: business name, phone, bio, logo photo,
 * and (optionally) service areas. Owner/admin only.
 *
 * PATCH /api/technician/profile  (multipart POST + _method=PATCH when a logo is attached)
 */
class UpdateTechnicianProfileController extends Controller
{
    public function __invoke(UpdateTechnicianProfileRequest $request, TechnicianStatus $status): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($organization->isProvider(), 403);
        abort_unless($user->canManageTeam(), 403, 'Only an owner or admin can edit the profile.');

        $profile = $organization->providerProfile;

        DB::transaction(function () use ($request, $organization, $profile) {
            $profile->fill($request->only(['business_name', 'phone', 'bio']));

            if ($request->hasFile('logo')) {
                // Replace the old logo if there was one.
                if ($profile->logo_path) {
                    Storage::disk('public')->delete($profile->logo_path);
                }
                $profile->logo_path = $request->file('logo')->store('provider-logos', 'public');
            }

            $profile->save();

            if ($request->has('service_states')) {
                $organization->serviceAreas()->delete();
                $organization->serviceAreas()->createMany(
                    collect($request->input('service_states'))->map(fn (string $state) => ['state' => $state])->all()
                );
            }
        });

        return response()->json([
            'technician' => $status->for($user->fresh()),
        ]);
    }
}
