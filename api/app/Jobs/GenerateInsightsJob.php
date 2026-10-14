<?php

namespace App\Jobs;

use App\Models\Organization;
use App\Services\InsightGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;

/**
 * Regenerates an organization's cached AI insight off the request hot path.
 * Dispatched only when the fleet data changed / went stale (see InsightService).
 * Overlap is prevented per org so a burst of triggers yields a single run.
 */
class GenerateInsightsJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $organizationId) {}

    public function handle(InsightGenerator $generator): void
    {
        $organization = Organization::find($this->organizationId);
        if ($organization === null) {
            return;
        }

        $generator->generate($organization);
    }

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [(new WithoutOverlapping((string) $this->organizationId))->dontRelease()];
    }
}
