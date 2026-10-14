<?php

namespace App\Http\Resources;

use App\Models\MaintenanceReview;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A completed job's review, visible to the customer and on the provider's
 * public profile.
 *
 * @mixin MaintenanceReview
 */
class MaintenanceReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'rating' => $this->rating,
            'ratingLabel' => number_format((float) $this->rating, 1),
            'comment' => $this->comment,
            'authorName' => $this->author?->first_name,
            'authorInitials' => $this->author?->initials,
            'createdAgo' => $this->created_at?->diffForHumans(),
        ];
    }
}
