<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;

/**
 * Organization membership lifecycle: provisioning a new user's org, adding and
 * removing memberships, and switching a user's active organization.
 *
 * Membership is many-to-many (the `organization_user` pivot carries the role);
 * `users.current_organization_id` points at the active org.
 */
class Teams
{
    /**
     * Give a newly-registered user their own organization (as owner). Any
     * pending invitations for their email stay pending — they accept those
     * explicitly in-app rather than being auto-joined.
     */
    public function provisionForNewUser(User $user): void
    {
        $this->createOwnOrganization($user);
    }

    public function createOwnOrganization(User $user): Organization
    {
        $name = trim((string) $user->name) !== '' ? $user->name."'s Team" : 'My Organization';

        $organization = Organization::create(['name' => $name]);
        $organization->forceFill(['owner_id' => $user->id])->save();
        $this->attach($user, $organization, 'owner');

        return $organization;
    }

    /**
     * Add (or update) a membership. By default the org also becomes the user's
     * active one — pass `$makeCurrent: false` to add a membership in the
     * background without switching them into it.
     */
    public function attach(User $user, Organization $organization, string $role, bool $makeCurrent = true): void
    {
        if ($user->organizations()->whereKey($organization->id)->exists()) {
            $user->organizations()->updateExistingPivot($organization->id, ['role' => $role]);
        } else {
            $user->organizations()->attach($organization->id, ['role' => $role]);
        }

        $user->unsetRelation('organizations');

        if ($makeCurrent) {
            $this->setCurrent($user, $organization);
        }
    }

    /** Point the user's active org at one they belong to. */
    public function setCurrent(User $user, Organization $organization): void
    {
        $user->forceFill(['current_organization_id' => $organization->id])->save();
    }

    /**
     * Hand an organization to a new owner (e.g. when the current owner leaves or
     * deletes their account). Promotes the successor's membership to `owner`; the
     * old owner keeps their membership at their existing role unless removed
     * separately.
     */
    public function transferOwnership(Organization $organization, User $newOwner): void
    {
        $organization->forceFill(['owner_id' => $newOwner->id])->save();
        $this->attach($newOwner, $organization, 'owner', makeCurrent: false);
    }

    /**
     * Remove a membership. If it was the user's active org, fall back to another
     * membership, or a fresh personal org when none remain. The org's fleet is
     * untouched — it stays with the organization.
     */
    public function removeFromOrganization(User $user, Organization $organization): void
    {
        $user->organizations()->detach($organization->id);
        $user->unsetRelation('organizations');

        if ($user->current_organization_id !== $organization->id) {
            return;
        }

        $next = $user->organizations()->first();

        if ($next !== null) {
            $this->setCurrent($user, $next);
        } else {
            $this->createOwnOrganization($user);
        }
    }
}
