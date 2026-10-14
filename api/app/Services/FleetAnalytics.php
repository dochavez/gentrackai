<?php

namespace App\Services;

use App\Models\Generator;
use App\Models\GeneratorReading;
use App\Models\MaintenanceItem;
use App\Models\Organization;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Deterministic fleet analytics for an organization — computed from stored data
 * with no AI, so it's always fresh and costs no tokens. Also produces the input
 * `digest` the AI layer uses to decide whether a recommendation needs
 * regenerating.
 */
class FleetAnalytics
{
    /**
     * Presentation-ready analytics for the Insights screen.
     *
     * @return array<string, mixed>
     */
    public function build(Organization $organization): array
    {
        $generators = $organization->generators()->get();
        $overdueMaintenance = $this->overdueMaintenanceCount($organization);

        [$score, $label, $subtext] = $this->health($generators, $overdueMaintenance);
        [$bars, $trendLabel, $weeklyAvg] = $this->weeklyRunHours($organization);

        return [
            'generatorCount' => $generators->count(),
            'healthScore' => $score,
            'healthLabel' => $label,
            'healthSubtext' => $subtext,
            'weeklyRunHours' => $bars,
            'runHoursTrendLabel' => $trendLabel,
            'forecastLabel' => $this->forecastLabel($weeklyAvg),
        ];
    }

    /**
     * A hash of the fleet state that would change the AI advice. Uses committed
     * columns (not the live projection) so a running generator doesn't churn the
     * digest every second.
     */
    public function digest(Organization $organization): string
    {
        $generators = $organization->generators()->orderBy('id')->get([
            'id', 'status', 'run_hours', 'fuel_level', 'battery_voltage', 'fuel_burn_rate',
        ]);

        $data = [
            'generators' => $generators->map(fn ($g) => [
                'id' => (int) $g->id,
                'status' => $g->status,
                'run_hours' => (float) $g->run_hours,
                'fuel_level' => $g->fuel_level,
                'battery_voltage' => $g->battery_voltage,
                'fuel_burn_rate' => $g->fuel_burn_rate,
            ])->all(),
            'overdue_maintenance' => $this->overdueMaintenanceCount($organization),
        ];

        return sha1((string) json_encode($data));
    }

    /**
     * @param  Collection<int, Generator>  $generators
     * @return array{0: int, 1: string, 2: string}
     */
    protected function health(Collection $generators, int $overdueMaintenance): array
    {
        if ($generators->isEmpty()) {
            return [100, 'Healthy', 'No generators yet'];
        }

        $offline = $generators->where('status', 'offline')->count();
        $needsCare = $generators->where('status', 'needs_care')->count();
        $lowFuel = $generators->filter(fn ($g) => $g->fuel_level !== null && $g->fuel_level < 20)->count();

        $score = 100 - ($offline * 15) - ($needsCare * 20) - ($lowFuel * 5) - ($overdueMaintenance * 10);
        $score = (int) max(0, min(100, $score));

        $label = match (true) {
            $score >= 85 => 'Healthy',
            $score >= 60 => 'Good, needs attention',
            default => 'Needs attention',
        };

        $subtext = match (true) {
            $offline > 0 => $offline.' '.Str::plural('generator', $offline).' offline',
            $needsCare > 0 => $needsCare.' '.Str::plural('generator', $needsCare).' need attention',
            $overdueMaintenance > 0 => $overdueMaintenance.' overdue on service',
            $lowFuel > 0 => $lowFuel.' low on fuel',
            default => 'All systems nominal',
        };

        return [$score, $label, $subtext];
    }

    /**
     * Fleet run hours accrued per week over the last 4 weeks, from logged
     * run-hours readings (positive deltas bucketed by the later reading's week).
     *
     * @return array{0: list<array{label: string, value: float}>, 1: string, 2: float}
     */
    protected function weeklyRunHours(Organization $organization): array
    {
        $weekStarts = [];
        for ($i = 0; $i < 4; $i++) {
            $weekStarts[] = Carbon::now()->startOfWeek()->subWeeks(3 - $i);
        }
        $buckets = [0.0, 0.0, 0.0, 0.0];
        $windowStart = $weekStarts[0];

        $readings = GeneratorReading::query()
            ->whereHas('generator', fn ($q) => $q->where('organization_id', $organization->id))
            ->where('metric', 'run_hours')
            ->orderBy('generator_id')
            ->orderBy('recorded_at')
            ->get(['generator_id', 'value', 'recorded_at']);

        $previous = [];
        foreach ($readings as $r) {
            $prev = $previous[$r->generator_id] ?? null;
            $previous[$r->generator_id] = $r;
            if ($prev === null) {
                continue;
            }
            $delta = (float) $r->value - (float) $prev->value;
            if ($delta <= 0 || $r->recorded_at->lt($windowStart)) {
                continue;
            }
            $idx = $this->weekIndex($r->recorded_at, $weekStarts);
            if ($idx !== null) {
                $buckets[$idx] += $delta;
            }
        }

        $bars = [];
        foreach ($buckets as $i => $value) {
            $bars[] = ['label' => 'W'.($i + 1), 'value' => round($value, 1)];
        }

        return [$bars, $this->trendLabel($buckets[2], $buckets[3]), array_sum($buckets) / 4];
    }

    /**
     * @param  list<Carbon>  $weekStarts
     */
    protected function weekIndex(Carbon $date, array $weekStarts): ?int
    {
        foreach ($weekStarts as $i => $start) {
            if ($date->gte($start) && $date->lt($start->copy()->addWeek())) {
                return $i;
            }
        }

        return null;
    }

    protected function trendLabel(float $previousWeek, float $lastWeek): string
    {
        if ($previousWeek <= 0) {
            return $lastWeek > 0 ? '↑ New' : 'No change';
        }

        $pct = (int) round((($lastWeek - $previousWeek) / $previousWeek) * 100);
        if ($pct === 0) {
            return 'No change';
        }

        return ($pct > 0 ? '↑ ' : '↓ ').abs($pct).'%';
    }

    protected function forecastLabel(float $weeklyAvg): string
    {
        if ($weeklyAvg <= 0) {
            return '—';
        }

        return '~'.round($weeklyAvg * (30 / 7)).' run hrs';
    }

    protected function overdueMaintenanceCount(Organization $organization): int
    {
        return MaintenanceItem::query()
            ->whereHas('generator', fn ($q) => $q->where('organization_id', $organization->id))
            ->whereNull('completed_at')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', today())
            ->count();
    }
}
