<?php

namespace App\Services;

use App\Models\MaintenanceRequest;
use App\Models\Organization;

/**
 * Answers "may this provider take on marketplace work?" — the technician-panel
 * counterpart to PlanGate. Access requires either an active technician
 * subscription or a remaining free-trial slot.
 *
 * The trial is USAGE-based: a job occupies a slot from the moment it is accepted
 * through completion, so a provider can't line up several "free" jobs at once.
 *
 * Capturing a card up front (`plans.technician.require_payment_method`) is off by
 * default because iOS cannot do it: App Store guideline 3.1.1 requires the
 * technician subscription to be sold with In-App Purchase, and Stripe's
 * setup-mode Checkout is exactly the "other payment mechanism" Apple rejects.
 * Turning it back on would lock iOS providers out of the trial.
 */
class TechnicianGate
{
    private function freeTrialJobs(): int
    {
        return (int) config('plans.technician.free_trial_jobs', 1);
    }

    /** Whether the up-front card capture is required before taking work at all. */
    private function requiresPaymentMethod(): bool
    {
        return (bool) config('plans.technician.require_payment_method', false);
    }

    /**
     * Billing is set up: a Stripe card was captured (setup-mode Checkout), or the
     * store is already billing this provider — an In-App Purchase subscription
     * carries its own payment method, so there is nothing for us to capture.
     */
    public function hasPaymentMethod(Organization $organization): bool
    {
        return (bool) $organization->providerProfile?->payment_ready
            || $organization->hasStoreSubscription('technician');
    }

    public function hasActiveSubscription(Organization $organization): bool
    {
        return $organization->onTechnicianPlan();
    }

    /** Jobs occupying a trial slot: accepted, scheduled, or completed. */
    public function trialSlotsUsed(Organization $organization): int
    {
        return $organization->providerJobs()
            ->whereIn('status', [
                MaintenanceRequest::STATUS_ACCEPTED,
                MaintenanceRequest::STATUS_SCHEDULED,
                MaintenanceRequest::STATUS_COMPLETED,
            ])
            ->count();
    }

    public function trialAvailable(Organization $organization): bool
    {
        return $this->trialSlotsUsed($organization) < $this->freeTrialJobs();
    }

    /** Whether the provider has capacity to win/keep a new job. */
    public function canWinJob(Organization $organization): bool
    {
        return $this->hasActiveSubscription($organization) || $this->trialAvailable($organization);
    }

    /** Whether the provider may submit a new offer (panel access + capacity). */
    public function canSubmitOffer(Organization $organization): bool
    {
        if ($this->requiresPaymentMethod() && ! $this->hasPaymentMethod($organization)) {
            return false;
        }

        return $this->canWinJob($organization);
    }
}
