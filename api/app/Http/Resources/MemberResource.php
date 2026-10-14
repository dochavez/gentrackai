<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class MemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'initials' => $this->initials,
            // Role within the listed org (from the membership pivot), not the
            // viewer's own active-org role.
            'role' => $this->pivot?->role ?? $this->roleIn(),
            'isMe' => $request->user() !== null && $this->id === $request->user()->id,
        ];
    }
}
