<?php

namespace App\Services;

use App\Models\Generator;
use App\Models\Organization;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Permanently deletes a user account and its personal data — required by App
 * Store Review guideline 5.1.1(v).
 *
 * The fleet is org-owned and shared, so a leaving user must never take the
 * team's data with them (same principle as Teams::removeFromOrganization). For
 * each organization the user belongs to:
 *
 *   - Solo org (no other members): deleted outright — it and its whole fleet
 *     are effectively the user's own data.
 *   - Shared org: the org and its fleet stay put. If the leaver owns it,
 *     ownership is handed to the next admin (or longest-standing member). Any
 *     generators/tasks the leaver created there are reassigned to the (new)
 *     owner so the `user_id` foreign key cascade doesn't delete shared records.
 *
 * Everything else follows from the schema's FK rules when the user row is
 * deleted: personal chat + notifications cascade away, memberships cascade, and
 * assignee / maintenance-creator / invited-by / org-owner / active-org pointers
 * null out.
 *
 * Accounts created through Sign in with Apple additionally have their Apple
 * grant revoked — guideline 5.1.1(v) requires it of any app offering Sign in
 * with Apple, so the app stops appearing under the user's Apple ID settings.
 */
class AccountDeletion
{
    public function __construct(private Teams $teams, private AppleTokens $appleTokens) {}

    public function delete(User $user): void
    {
        // Outside the transaction: this is a network call to Apple, and a slow
        // or failing one must not hold (or roll back) the local deletion.
        $this->revokeAppleGrant($user);

        DB::transaction(function () use ($user): void {
            $user->load('organizations');

            foreach ($user->organizations as $organization) {
                $hasOtherMembers = $organization->members()->whereKeyNot($user->id)->exists();

                if (! $hasOtherMembers) {
                    // Solo org — deleting it cascades its fleet, tasks, insights,
                    // invitations and the user's membership pivot.
                    $organization->delete();

                    continue;
                }

                // Shared org — keep it alive for the remaining members.
                if ($organization->pivot->role === 'owner') {
                    $successor = $this->pickSuccessor($organization, $user);

                    if ($successor !== null) {
                        $this->teams->transferOwnership($organization, $successor);
                    }
                }

                $this->reassignFleet($user, $organization);
            }

            // Sanctum tokens are a polymorphic relation (no FK cascade) — revoke
            // them explicitly before the user row goes.
            $user->tokens()->delete();
            $user->delete();
        });
    }

    /**
     * Revoke the user's Sign in with Apple grant before their row goes.
     *
     * Best effort by design: the account must still be deleted if Apple is down
     * or the server credentials aren't configured (the failure is logged by
     * AppleTokens), otherwise a third-party outage would block the deletion
     * right that guideline 5.1.1(v) exists to guarantee.
     */
    private function revokeAppleGrant(User $user): void
    {
        $refreshToken = $user->apple_refresh_token;

        if (! $refreshToken) {
            return;
        }

        $this->appleTokens->revokeRefreshToken($refreshToken);
    }

    /**
     * The member who inherits a shared org: an admin first, then the
     * longest-standing member. Null only when the leaver is the sole member,
     * which the caller treats as a solo org instead.
     */
    private function pickSuccessor(Organization $organization, User $leaving): ?User
    {
        return $organization->members()
            ->whereKeyNot($leaving->id)
            ->orderByRaw("CASE organization_user.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END")
            ->orderBy('organization_user.created_at')
            ->orderBy('users.id')
            ->first();
    }

    /**
     * Move the generators/tasks the leaver created within a surviving org onto
     * its owner, so deleting the user doesn't cascade-delete shared fleet
     * records. Soft-deleted generators are included — their rows still carry the
     * foreign key and would cascade too.
     */
    private function reassignFleet(User $user, Organization $organization): void
    {
        $ownerId = $organization->owner_id
            ?? $organization->members()->whereKeyNot($user->id)->value('users.id');

        if ($ownerId === null) {
            return;
        }

        Generator::withTrashed()
            ->where('organization_id', $organization->id)
            ->where('user_id', $user->id)
            ->update(['user_id' => $ownerId]);

        Task::where('organization_id', $organization->id)
            ->where('user_id', $user->id)
            ->update(['user_id' => $ownerId]);
    }
}
