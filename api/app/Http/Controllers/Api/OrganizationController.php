<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\MemberResource;
use App\Http\Resources\OrganizationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * The authenticated user's organization: its members (with roles) and, for
     * owners/admins, the pending invitations.
     *
     * GET /api/organization
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        $members = $organization->members()
            ->orderByRaw("CASE organization_user.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get();

        $payload = [
            'organization' => new OrganizationResource($organization),
            'role' => $user->role,
            'canManageTeam' => $user->canManageTeam(),
            'members' => MemberResource::collection($members),
        ];

        if ($user->canManageTeam()) {
            $payload['invitations'] = InvitationResource::collection(
                $organization->invitations()->pending()->with('inviter')->latest()->get()
            );
        }

        return response()->json($payload);
    }
}
