<?php

namespace App\Http\Resources;

use App\Models\ProviderProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * A technician provider's public-facing profile (identity, rating, reviews).
 *
 * @mixin ProviderProfile
 */
class ProviderProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'organizationId' => (string) $this->organization_id,
            'businessName' => $this->business_name,
            'bio' => $this->bio,
            'phone' => $this->phone,
            'logoUrl' => $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null,
            'ratingAvg' => $this->rating_avg,
            'ratingLabel' => $this->rating_avg !== null ? number_format((float) $this->rating_avg, 1) : null,
            'ratingsCount' => $this->ratings_count,
            'jobsCompleted' => $this->jobs_completed,
            'serviceStates' => $this->whenLoaded('organization', fn () => $this->organization->serviceAreas->pluck('state')->values()),
            'reviews' => MaintenanceReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }
}
