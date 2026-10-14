<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateMemberRequest;
use App\Http\Resources\MemberResource;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends Controller
{
    public function __construct(private Teams $teams) {}

    /**
     * Change a member's role (owner/admin only). The owner's role is fixed and
     * you cannot change your own.
     *
     * PATCH /api/organization/members/{user}
     */
    public function update(UpdateMemberRequest $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $organization = $actor->currentOrganization;
        abort_unless($user->belongsToOrganization($organization), 403);
        abort_if($user->isOwnerOf($organization), 403, 'The owner role cannot be changed.');
        abort_if($user->id === $actor->id, 403, 'You cannot change your own role.');

        $user->organizations()->updateExistingPivot($organization->id, ['role' => (string) $request->string('role')]);

        $member = $organization->members()->whereKey($user->id)->first();

        return response()->json(['member' => new MemberResource($member)]);
    }

    /**
     * Remove a member from the organization. They keep a working account (their
     * other memberships, or a fresh personal org); the fleet stays with the team.
     *
     * DELETE /api/organization/members/{user}
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        $actor = $request->user();
        $organization = $actor->currentOrganization;
        abort_unless($actor->canManageTeam(), 403);
        abort_unless($user->belongsToOrganization($organization), 403);
        abort_if($user->isOwnerOf($organization), 403, 'The owner cannot be removed.');
        abort_if($user->id === $actor->id, 403, 'You cannot remove yourself.');

        $this->teams->removeFromOrganization($user, $organization);

        return response()->json(null, 204);
    }
}
