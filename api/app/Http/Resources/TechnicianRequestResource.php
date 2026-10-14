<?php

namespace App\Http\Resources;

use App\Models\MaintenanceOffer;
use App\Models\MaintenanceRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A marketplace request/job as the TECHNICIAN sees it. Pre-acceptance, customer
 * PII is limited to a first name + state; the technician's own offer is surfaced
 * but competitors' offers are not.
 *
 * @mixin MaintenanceRequest
 */
class TechnicianRequestResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // The viewer's provider org == their active org.
        $providerOrgId = $request->user()?->organization_id;
        $mine = $this->relationLoaded('offers')
            ? $this->offers->firstWhere('provider_organization_id', $providerOrgId)
            : null;

        // Once this provider won the job, the customer's full name is shown so
        // the technician can coordinate (payment stays off-platform).
        $isMyJob = $this->provider_organization_id !== null && $this->provider_organization_id === $providerOrgId;
        $review = $this->relationLoaded('review') ? $this->review : null;

        return [
            'id' => (string) $this->id,
            'status' => $this->status,
            'statusLabel' => $this->statusLabel(),
            'detail' => $this->detail,
            'state' => $this->state,
            'generatorLabel' => $this->generatorLabel(),
            'customerName' => $isMyJob ? $this->creator?->name : $this->creator?->first_name,
            'customerInitials' => $this->creator?->initials,
            'createdAgo' => $this->created_at?->diffForHumans(),
            'scheduledAt' => $this->scheduled_at?->toIso8601String(),
            'scheduleLabel' => $this->scheduled_at?->format('D, M j · g:i A'),
            'offersCount' => (int) ($this->offers_count ?? 0),
            // The viewer's own offer (if any).
            'hasMyOffer' => $mine !== null,
            'myOfferId' => $mine ? (string) $mine->id : null,
            'myOfferStatus' => $mine?->status,
            'myOfferPriceLabel' => $mine ? '$'.number_format((float) $mine->price, 2) : null,
            // Feed affordance: can still bid.
            'canOffer' => $this->status === MaintenanceRequest::STATUS_OPEN && $mine === null,
            // Job affordances (the app also checks role for assign).
            'needsAssignment' => $this->status === MaintenanceRequest::STATUS_ACCEPTED && $this->assigned_technician_id === null,
            'canSchedule' => $this->status === MaintenanceRequest::STATUS_ACCEPTED && $this->assigned_technician_id !== null,
            'canComplete' => $this->status === MaintenanceRequest::STATUS_SCHEDULED,
            'assignedTechnicianName' => $this->assignedTechnician?->name,
            'assignedTechnicianInitials' => $this->assignedTechnician?->initials,
            'acceptedPriceLabel' => $this->acceptedOffer
                ? '$'.number_format((float) $this->acceptedOffer->price, 2)
                : null,
            'review' => $review ? new MaintenanceReviewResource($review) : null,
            'hasReview' => $review !== null,
        ];
    }

    protected function statusLabel(): string
    {
        return match ($this->status) {
            MaintenanceRequest::STATUS_OPEN => 'Open',
            MaintenanceRequest::STATUS_ACCEPTED => $this->assigned_technician_id === null
                ? 'Won · assign a technician'
                : 'Won · schedule the visit',
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
