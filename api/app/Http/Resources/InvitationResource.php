<?php

namespace App\Http\Resources;

use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Invitation
 */
class InvitationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'invitedAgo' => $this->created_at?->diffForHumans(),
            'organizationName' => $this->organization?->name,
            'invitedBy' => $this->inviter?->name,
        ];
    }
}
