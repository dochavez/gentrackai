<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\Teams;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SwitchOrganizationController extends Controller
{
    public function __construct(private Teams $teams) {}

    /**
     * Switch the authenticated user's active organization to another one they
     * belong to. Returns the refreshed user (with the new active org + role).
     *
     * POST /api/organization/switch
     */
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'organization_id' => ['required', 'integer'],
        ]);

        $user = $request->user();
        $organization = $user->organizations()->whereKey($data['organization_id'])->first();
        abort_if($organization === null, 403, 'You are not a member of that organization.');

        $this->teams->setCurrent($user, $organization);
        $user->refresh()->load('organizations');

        return response()->json(['user' => new UserResource($user)]);
    }
}
