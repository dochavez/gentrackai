<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

/**
 * Builds the presentation-ready technician-panel status the app reads to gate
 * the panel and render subscription/trial state. Keeps the derivation on the
 * backend (the app renders raw values).
 */
class TechnicianStatus
{
    public function __construct(private TechnicianGate $gate) {}

    /**
     * @return array<string, mixed>
     */
    public function for(User $user): array
    {
        /** @var Organization|null $org */
        $org = $user->organization;
        $profile = $org?->providerProfile;
        $isProvider = $profile !== null;

        $limit = (int) config('plans.technician.free_trial_jobs', 1);
        $used = $isProvider ? $this->gate->trialSlotsUsed($org) : 0;
        $subscribed = $isProvider && $org->onTechnicianPlan();
        $paymentReady = (bool) $profile?->payment_ready;
        $panelUnlocked = $isProvider && $this->gate->canSubmitOffer($org);

        return [
            'isProvider' => $isProvider,
            'businessName' => $profile?->business_name,
            'phone' => $profile?->phone,
            'bio' => $profile?->bio,
            'logoUrl' => $profile?->logo_path ? Storage::disk('public')->url($profile->logo_path) : null,
            'serviceStates' => $isProvider
                ? $org->serviceAreas()->orderBy('state')->pluck('state')->values()
                : [],
            'paymentReady' => $paymentReady,
            'subscribed' => $subscribed,
            // See BillingController: which channel bills this subscription.
            'source' => $isProvider ? $org->subscriptionSource('technician') : null,
            'panelUnlocked' => $panelUnlocked,
            'ratingLabel' => $profile?->rating_avg !== null ? number_format((float) $profile->rating_avg, 1) : null,
            'ratingsCount' => $profile?->ratings_count ?? 0,
            'jobsCompleted' => $profile?->jobs_completed ?? 0,
            'trial' => [
                'limit' => $limit,
                'used' => $used,
                'remaining' => max(0, $limit - $used),
            ],
            'subscriptionStatusLabel' => $this->statusLabel($subscribed, $paymentReady, $limit, $used),
            'canManageBilling' => $user->canManageTeam(),
        ];
    }

    private function statusLabel(bool $subscribed, bool $paymentReady, int $limit, int $used): string
    {
        if ($subscribed) {
            return 'Subscription active';
        }
        // Only ask for a card when the gate actually requires one (it doesn't on
        // iOS, where the subscription is an In-App Purchase — see TechnicianGate).
        if (! $paymentReady && config('plans.technician.require_payment_method', false)) {
            return 'Add a payment method to start your free trial';
        }

        $remaining = max(0, $limit - $used);

        return $remaining > 0
            ? 'Free trial · '.$remaining.' '.($remaining === 1 ? 'job' : 'jobs').' left'
            : 'Trial used — subscribe to keep taking jobs';
    }
}
