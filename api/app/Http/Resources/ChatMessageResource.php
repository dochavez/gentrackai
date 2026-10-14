<?php

namespace App\Http\Resources;

use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin ChatMessage
 */
class ChatMessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'role' => $this->role,
            'content' => $this->content,
            'imageUrl' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'timeAgo' => $this->created_at?->diffForHumans(),
        ];
    }
}
