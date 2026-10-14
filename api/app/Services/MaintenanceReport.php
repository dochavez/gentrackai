<?php

namespace App\Services;

use App\Models\MaintenanceItem;
use App\Models\Organization;
use Illuminate\Support\Carbon;

/**
 * Builds the fleet maintenance report — completed services over a period with
 * cost paid and estimated savings — for an organization. Only active
 * (non-deleted) generators are included (the `generator` relation applies its
 * soft-delete scope). Shared by the JSON and PDF endpoints.
 */
class MaintenanceReport
{
    /** Period key → number of months back. */
    public const PERIODS = [
        '3mo' => 3,
        '6mo' => 6,
        '9mo' => 9,
        '1y' => 12,
        '5y' => 60,
    ];

    /**
     * @return array<string, mixed>
     */
    public function build(Organization $organization, string $period = '6mo'): array
    {
        $months = self::PERIODS[$period] ?? self::PERIODS['6mo'];
        $period = isset(self::PERIODS[$period]) ? $period : '6mo';

        $end = Carbon::now();
        $start = $end->copy()->subMonths($months)->startOfDay();

        $items = MaintenanceItem::query()
            ->whereHas('generator', fn ($q) => $q->where('organization_id', $organization->id))
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$start, $end])
            ->with('generator')
            ->orderByDesc('completed_at')
            ->get();

        $totalPaid = (float) $items->sum('cost');
        $estSaved = (float) $items->sum('est_saved');

        return [
            'period' => $period,
            'periodLabel' => $this->periodLabel($start, $end),
            'summary' => [
                'services' => $items->count(),
                'totalPaid' => $totalPaid,
                'totalPaidLabel' => $this->money($totalPaid),
                'estSaved' => $estSaved,
                'estSavedLabel' => $this->money($estSaved),
            ],
            'services' => $items->map(fn (MaintenanceItem $item) => [
                'id' => (string) $item->id,
                'dateLabel' => $item->completed_at?->format('M j'),
                'title' => $item->title,
                'generatorName' => $item->generator?->name,
                'cost' => $item->cost,
                'costLabel' => $item->cost !== null ? $this->money((float) $item->cost) : '—',
            ])->all(),
            'note' => 'Includes cost paid and estimated savings. History kept up to 5 years.',
        ];
    }

    protected function periodLabel(Carbon $start, Carbon $end): string
    {
        return $start->year === $end->year
            ? $start->format('M').' – '.$end->format('M Y')
            : $start->format('M Y').' – '.$end->format('M Y');
    }

    protected function money(float $amount): string
    {
        return '$'.number_format($amount, 0);
    }
}
