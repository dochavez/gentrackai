<?php

namespace App\Http\Resources;

use App\Models\MaintenanceRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A marketplace request as the CUSTOMER sees it: full status, the offers they
 * can choose from, the winning provider, and the review. All labels are
 * computed here so the app renders raw values.
 *
 * @mixin MaintenanceRequest
 */
class MaintenanceRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->providerOrganization?->providerProfile;
        $review = $this->relationLoaded('review') ? $this->review : null;

        return [
            'id' => (string) $this->id,
            'status' => $this->status,
            'statusLabel' => $this->statusLabel(),
            'detail' => $this->detail,
            'state' => $this->state,
            'generatorId' => $this->generator_id ? (string) $this->generator_id : null,
            'generatorName' => $this->generator?->name,
            'generatorLabel' => $this->generatorLabel(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'createdAgo' => $this->created_at?->diffForHumans(),
            'scheduledAt' => $this->scheduled_at?->toIso8601String(),
            'scheduleLabel' => $this->scheduled_at?->format('D, M j · g:i A'),
            'completedAt' => $this->completed_at?->toIso8601String(),
            'offersCount' => (int) ($this->offers_count ?? 0),
            // Included on detail (show) only, where offers are eager-loaded.
            'offers' => MaintenanceOfferResource::collection($this->whenLoaded('offers')),
            // The winning provider, once accepted.
            'providerName' => $profile?->business_name ?: $this->providerOrganization?->name,
            'providerRating' => $profile?->rating_avg,
            'assignedTechnicianName' => $this->assignedTechnician?->name,
            'assignedTechnicianInitials' => $this->assignedTechnician?->initials,
            'acceptedPriceLabel' => $this->acceptedOffer
                ? '$'.number_format((float) $this->acceptedOffer->price, 2)
                : null,
            'review' => $review ? new MaintenanceReviewResource($review) : null,
            'hasReview' => $review !== null,
            'canReview' => $this->status === MaintenanceRequest::STATUS_COMPLETED && $review === null,
            'canCancel' => in_array($this->status, [
                MaintenanceRequest::STATUS_OPEN,
                MaintenanceRequest::STATUS_ACCEPTED,
            ], true),
        ];
    }

    protected function statusLabel(): string
    {
        return match ($this->status) {
            MaintenanceRequest::STATUS_OPEN => 'Collecting offers',
            MaintenanceRequest::STATUS_ACCEPTED => 'Offer accepted',
            MaintenanceRequest::STATUS_SCHEDULED => 'Scheduled',
            MaintenanceRequest::STATUS_COMPLETED => 'Completed',
            MaintenanceRequest::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst((string) $this->status),
        };
    }

    protected function generatorLabel(): ?string
    {
        $generator = $this->generator;
        if ($generator === null) {
            return null;
        }

        $make = trim((string) $generator->manufacturer.' '.(string) $generator->model_number);

        return $make !== '' ? $make : $generator->name;
    }
}
