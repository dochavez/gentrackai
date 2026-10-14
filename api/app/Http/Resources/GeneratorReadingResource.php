<?php

namespace App\Http\Resources;

use App\Models\GeneratorReading;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin GeneratorReading
 */
class GeneratorReadingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'metric' => $this->metric,
            'metricLabel' => $this->metricLabel(),
            'value' => $this->value,
            'valueLabel' => $this->valueLabel(),
            'note' => $this->note,
            'recordedAt' => $this->recorded_at?->toIso8601String(),
            'recordedAgo' => $this->recorded_at?->diffForHumans(),
        ];
    }

    protected function metricLabel(): string
    {
        return match ($this->metric) {
            'fuel' => 'Fuel',
            'run_hours' => 'Run hours',
            'battery' => 'Battery',
            default => Str::headline($this->metric),
        };
    }

    protected function valueLabel(): string
    {
        return match ($this->metric) {
            'fuel' => round($this->value).'%',
            'run_hours' => number_format($this->value, 1).' hrs',
            'battery' => number_format($this->value, 1).' V',
            default => (string) $this->value,
        };
    }
}
