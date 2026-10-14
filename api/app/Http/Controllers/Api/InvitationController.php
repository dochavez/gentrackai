<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InviteMemberRequest;
use App\Http\Resources\InvitationResource;
use App\Models\Invitation;
use App\Notifications\OrganizationInvitationNotification;
use App\Services\PlanGate;
use App\Services\Teams;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    public function __construct(private Teams $teams) {}

    /**
     * Pending invitations addressed to the authenticated user (for the in-app
     * accept prompt).
     *
     * GET /api/invitations
     */
    public function index(Request $request): JsonResponse
    {
        $invitations = Invitation::query()
            ->pending()
            ->where('email', strtolower((string) $request->user()->email))
            ->with(['organization', 'inviter'])
            ->latest()
            ->get()
            ->reject(fn (Invitation $i) => $i->isExpired())
            ->values();

        return response()->json(['invitations' => InvitationResource::collection($invitations)]);
    }

    /**
     * Invite someone by email (owner/admin). Always returns the same generic
     * response — it never reveals whether that email already has an account.
     *
     * POST /api/organization/invitations
     */
    public function store(InviteMemberRequest $request, PlanGate $plans): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        $email = strtolower((string) $request->string('email'));
        $role = (string) $request->string('role');

        // Idempotent per email + org.
        $invitation = $organization->invitations()->pending()->where('email', $email)->first();
        $alreadyMember = $organization->members()->where('email', $email)->exists();

        // Plan gate: the Free plan caps team size; Pro is unlimited. Re-inviting an
        // existing pending invite or an existing member never needs a new seat.
        if ($invitation === null && ! $alreadyMember && ! $plans->canAddMember($organization)) {
            return response()->json([
                'message' => "You've reached the team-member limit on the Free plan. Upgrade to Pro to invite more.",
                'upgradeRequired' => true,
                'feature' => 'members',
            ], 402);
        }

        if ($invitation !== null) {
            $invitation->update(['role' => $role, 'invited_by' => $user->id, 'expires_at' => now()->addDays(14)]);
        } else {
            $invitation = $organization->invitations()->create([
                'email' => $email,
                'role' => $role,
                'token' => Str::random(64),
                'invited_by' => $user->id,
                'expires_at' => now()->addDays(14),
            ]);
        }

        // Don't re-notify someone already on this team (still a generic response).
        if (! $alreadyMember) {
            Notification::route('mail', $email)->notify(new OrganizationInvitationNotification($invitation));
        }

        return response()->json(['message' => "Invitation sent to {$email}."], 202);
    }

    /**
     * Accept an invitation addressed to the authenticated user — joins the org.
     *
     * PATCH /api/invitations/{invitation}
     */
    public function update(Request $request, Invitation $invitation): JsonResponse
    {
        $user = $request->user();
        abort_unless(strcasecmp($invitation->email, $user->email) === 0, 403);
        abort_if($invitation->accepted_at !== null || $invitation->isExpired(), 410, 'This invitation is no longer valid.');

        $this->teams->attach($user, $invitation->organization, $invitation->role);
        $invitation->update(['accepted_at' => now()]);

        return response()->json(['message' => 'Joined '.$invitation->organization->name.'.']);
    }

    /**
     * Cancel a pending invite (owner/admin) or decline one (the invitee).
     *
     * DELETE /api/invitations/{invitation}
     */
    public function destroy(Request $request, Invitation $invitation): JsonResponse
    {
        $user = $request->user();
        $isInvitee = strcasecmp($invitation->email, $user->email) === 0;
        $isManager = $user->canManageTeamIn($invitation->organization_id);
        abort_unless($isInvitee || $isManager, 403);

        $invitation->delete();

        return response()->json(null, 204);
    }
}
