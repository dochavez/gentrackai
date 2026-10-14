<?php

namespace App\Services;

use App\Models\MaintenanceOffer;
use App\Models\MaintenanceRequest;
use App\Models\MaintenanceReview;
use App\Models\Notification;
use App\Models\ProviderServiceArea;
use Illuminate\Support\Facades\DB;

/**
 * In-app notification fan-out for the maintenance marketplace. Writes to the
 * `app_notifications` table (App\Models\Notification), mirroring the pattern in
 * MaintenanceController. Push (APNs/FCM) is not wired in this app.
 */
class MarketplaceNotifications
{
    /** A new request → every technician in a matching (other) provider org. */
    public function requestBroadcast(MaintenanceRequest $request): void
    {
        $providerOrgIds = ProviderServiceArea::where('state', $request->state)
            ->where('provider_organization_id', '!=', $request->organization_id)
            ->pluck('provider_organization_id')
            ->unique();

        if ($providerOrgIds->isEmpty()) {
            return;
        }

        $userIds = DB::table('organization_user')
            ->whereIn('organization_id', $providerOrgIds)
            ->pluck('user_id')
            ->unique();

        foreach ($userIds as $userId) {
            $this->notify($userId, 'New maintenance request', 'A generator needs service in '.$request->state.'.', '🛠️', '/technician/requests/'.$request->id);
        }
    }

    /** An offer was submitted → the request's creator. */
    public function offerSubmitted(MaintenanceOffer $offer, MaintenanceRequest $request): void
    {
        if ($request->created_by === null) {
            return;
        }

        $this->notify(
            $request->created_by,
            'New offer received',
            '$'.number_format((float) $offer->price, 2).' offer on your maintenance request.',
            '💬',
            '/maintenance-requests/'.$request->id,
        );
    }

    /** An offer was accepted → the winning technician (offer submitter). */
    public function offerAccepted(MaintenanceOffer $offer): void
    {
        if ($offer->user_id === null) {
            return;
        }

        $this->notify($offer->user_id, 'Offer accepted', 'Your offer was accepted. Schedule the visit.', '🎉', '/technician/jobs/'.$offer->maintenance_request_id);
    }

    /** The visit was scheduled → the request's creator. */
    public function scheduled(MaintenanceRequest $request): void
    {
        if ($request->created_by === null) {
            return;
        }

        $this->notify(
            $request->created_by,
            'Maintenance scheduled',
            'Your technician scheduled the visit for '.$request->scheduled_at?->format('M j, g:i A').'.',
            '📅',
            '/maintenance-requests/'.$request->id,
        );
    }

    /** The job was marked complete / a review was requested → the creator. */
    public function reviewRequested(MaintenanceRequest $request): void
    {
        if ($request->created_by === null) {
            return;
        }

        $this->notify($request->created_by, 'How did it go?', 'Your maintenance is complete — leave a review.', '⭐', '/maintenance-requests/'.$request->id);
    }

    /** A review was left → the assigned technician (or offer submitter). */
    public function reviewLeft(MaintenanceReview $review, MaintenanceRequest $request): void
    {
        $target = $request->assigned_technician_id ?? $request->acceptedOffer?->user_id;
        if ($target === null) {
            return;
        }

        $this->notify($target, 'New review', 'A customer left you a '.$review->rating.'-star review.', '⭐', '/technician/jobs/'.$request->id);
    }

    /** A request was cancelled → each provider that had a pending offer. */
    public function cancelled(MaintenanceRequest $request): void
    {
        $userIds = $request->offers()
            ->where('status', MaintenanceOffer::STATUS_PENDING)
            ->whereNotNull('user_id')
            ->pluck('user_id')
            ->unique();

        foreach ($userIds as $userId) {
            $this->notify($userId, 'Request cancelled', 'A request you offered on was cancelled.', '🚫', '/technician/requests');
        }
    }

    private function notify(int $userId, string $title, string $body, string $icon, ?string $link = null): void
    {
        Notification::create([
            'user_id' => $userId,
            'type' => 'maintenance',
            'icon' => $icon,
            'title' => $title,
            'body' => $body,
            'link' => $link,
        ]);
    }
}
