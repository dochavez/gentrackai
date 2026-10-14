<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\RevenueCat;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serializes a User into the shape the app's `AppUser` type expects
 * (see src/types/auth.ts). Presentation values (`firstName`, `initials`) are
 * computed by the model so nothing is derived on the frontend.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Memberships carry the per-org role via the pivot; the active org is
        // whichever one matches current_organization_id.
        $memberships = $this->organizations;
        $current = $memberships->firstWhere('id', $this->current_organization_id);
        $currentRole = $current?->pivot->role;

        // Active-org plan status, so the app can gate features / show the paywall.
        $onPro = $current?->onPro() ?? false;

        return [
            'id' => (string) $this->id,
            'email' => $this->email,
            'name' => $this->name,
            'firstName' => $this->first_name,
            'initials' => $this->initials,
            'photoUrl' => $this->avatar,
            'provider' => $this->provider,
            'emailVerified' => $this->hasVerifiedEmail(),
            'role' => $currentRole,
            'canManageTeam' => in_array($currentRole, ['owner', 'admin'], true),
            'organizationId' => $this->current_organization_id ? (string) $this->current_organization_id : null,
            'organizationName' => $current?->name,
            'plan' => $onPro ? 'pro' : 'free',
            'subscribed' => $onPro,
            // The RevenueCat "app user id" the app must `logIn()` with before a
            // StoreKit / Play Billing purchase, so the entitlement lands on the
            // active organization rather than an anonymous device id. Built here
            // (not in the app) because the backend owns that string format --
            // see RevenueCat::appUserId() and the webhook that parses it back.
            'iapAppUserId' => $current ? app(RevenueCat::class)->appUserId($current) : null,
            // Service address (for the maintenance marketplace). `hasAddress` is the
            // backend-computed gate the app checks before letting a user request one.
            'addressLine1' => $this->address_line1,
            'addressLine2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'postalCode' => $this->postal_code,
            'country' => $this->country,
            'phone' => $this->phone,
            'hasAddress' => $this->hasAddress(),
            // Whether the active org is a technician provider (panel usable now).
            'isTechnician' => (bool) $current?->isProvider(),
            // Every org the user belongs to, for the in-app switcher.
            'organizations' => $memberships->map(fn ($organization) => [
                'id' => (string) $organization->id,
                'name' => $organization->name,
                'role' => $organization->pivot->role,
                'isCurrent' => $organization->id === $this->current_organization_id,
            ])->values(),
        ];
    }
}
