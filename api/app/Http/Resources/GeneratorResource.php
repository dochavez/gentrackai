<?php

namespace App\Http\Resources;

use App\Models\Generator;
use App\Services\GeneratorUsage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Serializes a Generator into the shape the app's `Generator` type expects
 * (see src/features/generators/types.ts in the app). Consumption values are
 * the backend's live projection (see GeneratorUsage), with presentation-ready
 * captions — the app never derives these itself.
 *
 * @mixin Generator
 */
class GeneratorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $snapshot = app(GeneratorUsage::class)->snapshot($this->resource);
        $running = $this->isRunning();

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'manufacturer' => $this->manufacturer,
            'modelNumber' => $this->model_number,
            'ratedPower' => $this->rated_power,
            'fuelType' => $this->fuel_type,
            'type' => $this->type,
            'serialNumber' => $this->serial_number,
            'transferSwitch' => $this->transfer_switch,
            'serviceInterval' => $this->service_interval,
            'location' => $this->location,
            'status' => $this->status,
            'isRunning' => $running,
            'runHours' => $snapshot['runHours'],
            'fuelLevel' => $snapshot['fuelLevel'],
            'batteryVoltage' => $snapshot['batteryVoltage'],
            'fuelBurnRate' => $this->fuel_burn_rate,
            'fuelCaption' => $this->fuelCaption($running),
            'runHoursCaption' => $this->runHoursCaption($running),
            'batteryCaption' => $this->batteryCaption(),
            'installedAt' => $this->installed_at?->toDateString(),
            'imageUrl' => $this->image_path ? Storage::disk('public')->url($this->image_path) : null,
            'confidence' => $this->confidence,
            'createdAt' => $this->created_at?->toIso8601String(),
            'addedAgo' => $this->created_at?->diffForHumans(),
        ];
    }

    protected function fuelCaption(bool $running): ?string
    {
        if ($this->fuel_level === null) {
            return null;
        }
        if ($running && $this->fuel_burn_rate !== null) {
            return 'Updating live';
        }

        return $this->fuel_reading_at ? 'as of '.$this->fuel_reading_at->diffForHumans() : null;
    }

    protected function runHoursCaption(bool $running): ?string
    {
        if ($running) {
            return 'Updating live';
        }

        return $this->run_hours_reading_at ? 'as of '.$this->run_hours_reading_at->diffForHumans() : null;
    }

    protected function batteryCaption(): ?string
    {
        if ($this->battery_voltage === null) {
            return null;
        }

        return $this->battery_reading_at ? 'as of '.$this->battery_reading_at->diffForHumans() : null;
    }
}
