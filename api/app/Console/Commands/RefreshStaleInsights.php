<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Services\InsightService;
use Illuminate\Console\Command;

class RefreshStaleInsights extends Command
{
    /**
     * @var string
     */
    protected $signature = 'insights:refresh-stale';

    /**
     * @var string
     */
    protected $description = 'Regenerate stale AI insights for organizations whose fleet data changed (daily backstop).';

    public function handle(InsightService $service): int
    {
        $count = 0;

        Organization::query()->has('generators')->chunkById(100, function ($organizations) use ($service, &$count) {
            foreach ($organizations as $organization) {
                if ($service->refreshIfStale($organization)) {
                    $count++;
                }
            }
        });

        $this->info("Queued regeneration for {$count} organization(s).");

        return self::SUCCESS;
    }
}
