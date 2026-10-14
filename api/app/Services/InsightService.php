<?php

namespace App\Services;

use App\Jobs\GenerateInsightsJob;
use App\Models\Insight;
use App\Models\Organization;

/**
 * Decides *when* an organization's cached AI recommendation should be
 * regenerated, and dispatches the (queued) job. Regeneration happens only when
 * the fleet's input digest changes or the cache goes stale — and never more
 * often than the configured minimum interval — so tokens aren't burned on reads.
 */
class InsightService
{
    public function __construct(private FleetAnalytics $analytics) {}

    /** Enqueue a regeneration if the cache is stale and the min interval has elapsed. */
    public function refreshIfStale(Organization $organization): bool
    {
        $insight = $organization->insight;

        if ($insight?->generating) {
            return false;
        }
        if (! $this->isStale($insight, $this->analytics->digest($organization))) {
            return false;
        }
        if (! $this->minIntervalElapsed($insight)) {
            return false;
        }

        GenerateInsightsJob::dispatch($organization->id);

        return true;
    }

    /** Force a regeneration (used by the rate-limited manual refresh endpoint). */
    public function forceRefresh(Organization $organization): void
    {
        GenerateInsightsJob::dispatch($organization->id);
    }

    public function isStale(?Insight $insight, string $currentDigest): bool
    {
        if (! $insight || $insight->payload === null) {
            return true;
        }
        if ($insight->input_digest !== $currentDigest) {
            return true;
        }

        return $insight->generated_at === null
            || $insight->generated_at->lt(now()->subDays((int) config('insights.ttl_days')));
    }

    protected function minIntervalElapsed(?Insight $insight): bool
    {
        if (! $insight || $insight->generated_at === null) {
            return true;
        }

        return $insight->generated_at->lt(now()->subHours((int) config('insights.min_interval_hours')));
    }
}
