<?php

namespace App\Services;

use App\Models\Organization;

/**
 * Answers "does this organization's plan allow X?" from the limits in
 * config/plans.php (Free vs Pro). A `null` limit means unlimited (Pro).
 * Keeps plan/billing logic out of the controllers.
 *
 * When `plans.enforce` is false, every limit reads as unlimited — the billing
 * plumbing can ship to production without gating existing users, then be
 * switched on (PLAN_ENFORCE=true) at launch.
 */
class PlanGate
{
    private function enforced(): bool
    {
        return (bool) config('plans.enforce', true);
    }

    /** @return int|null null = unlimited */
    public function generatorLimit(Organization $organization): ?int
    {
        return $this->enforced() ? $organization->planLimits()['generators'] : null;
    }

    public function canAddGenerator(Organization $organization): bool
    {
        $limit = $this->generatorLimit($organization);

        return $limit === null || $organization->generators()->count() < $limit;
    }

    /** @return int|null null = unlimited */
    public function memberLimit(Organization $organization): ?int
    {
        return $this->enforced() ? $organization->planLimits()['members'] : null;
    }

    public function canAddMember(Organization $organization): bool
    {
        $limit = $this->memberLimit($organization);

        return $limit === null || $organization->members()->count() < $limit;
    }

    public function allowsInsights(Organization $organization): bool
    {
        return ! $this->enforced() || (bool) $organization->planLimits()['insights'];
    }

    /** @return int|null null = unlimited */
    public function chatDailyLimit(Organization $organization): ?int
    {
        return $this->enforced() ? $organization->planLimits()['chat_daily'] : null;
    }
}
