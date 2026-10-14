<?php

namespace App\Http\Resources;

use App\Models\MaintenanceOffer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * A technician provider's bid, as the customer sees it (provider identity +
 * rating + price). Presentation values are computed here.
 *
 * @mixin MaintenanceOffer
 */
class MaintenanceOfferResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->providerOrganization?->providerProfile;
        $providerName = $profile?->business_name ?: $this->providerOrganization?->name;

        return [
            'id' => (string) $this->id,
            'price' => $this->price,
            'priceLabel' => '$'.number_format((float) $this->price, 2),
            'message' => $this->message,
            'status' => $this->status,
            'accepted' => $this->status === MaintenanceOffer::STATUS_ACCEPTED,
            'providerId' => $this->provider_organization_id ? (string) $this->provider_organization_id : null,
            'providerName' => $providerName,
            'providerLogoUrl' => $profile?->logo_path ? Storage::disk('public')->url($profile->logo_path) : null,
            'providerRating' => $profile?->rating_avg,
            'ratingLabel' => $profile?->rating_avg !== null ? number_format((float) $profile->rating_avg, 1) : null,
            'ratingsCount' => $profile?->ratings_count ?? 0,
            'jobsCompleted' => $profile?->jobs_completed ?? 0,
            'submittedBy' => $this->user?->name,
            'createdAgo' => $this->created_at?->diffForHumans(),
        ];
    }
}
