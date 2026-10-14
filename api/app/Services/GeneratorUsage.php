<?php

namespace App\Services;

use App\Models\Generator;
use App\Models\GeneratorReading;
use Illuminate\Support\Carbon;

/**
 * Projects a generator's consumption forward from its last anchor so fuel and
 * run hours change over time without live sensors.
 *
 * The generator carries committed values (`run_hours`, `fuel_level`) that are
 * accurate as of `running_since`. While the generator is running, the open
 * interval `running_since → now` is projected on read. When it stops — or when
 * a fresh reading arrives — that interval is *committed* into the columns and
 * the clock re-anchors, so history never depends on more than one open interval.
 *
 * Everything here is an estimate (no telemetry); values are rounded for display.
 */
class GeneratorUsage
{
    /**
     * Live snapshot at $now, projecting the open running interval. Read-only.
     *
     * @return array{runHours: float, fuelLevel: float|null, batteryVoltage: float|null}
     */
    public function snapshot(Generator $generator, ?Carbon $now = null): array
    {
        $now ??= Carbon::now();
        $hours = $this->runningHoursSince($generator, $now);

        $fuel = $generator->fuel_level;
        if ($fuel !== null && $generator->fuel_burn_rate !== null && $hours > 0) {
            $fuel = max(0.0, (float) $fuel - (float) $generator->fuel_burn_rate * $hours);
        }

        return [
            'runHours' => round((float) $generator->run_hours + $hours, 1),
            'fuelLevel' => $fuel === null ? null : round((float) $fuel, 1),
            'batteryVoltage' => $generator->battery_voltage,
        ];
    }

    /**
     * Apply a status change: commit and stop the clock when the generator
     * stops consuming, start it when it begins. Persists the generator.
     */
    public function applyStatus(Generator $generator, string $status, ?Carbon $at = null): void
    {
        $at ??= Carbon::now();
        $wasRunning = $generator->isRunning();
        $willRun = $status === 'running';

        if ($wasRunning && ! $willRun) {
            $this->commit($generator, $at);
            $generator->running_since = null;
        } elseif (! $wasRunning && $willRun) {
            $generator->running_since = $at;
        }

        $generator->status = $status;
        $generator->save();
    }

    /**
     * Record a reading for one metric: fold any open interval up to $at,
     * overwrite the committed value, re-anchor the clock, and log a history row.
     */
    public function record(
        Generator $generator,
        string $metric,
        float $value,
        ?Carbon $at = null,
        ?string $note = null,
    ): GeneratorReading {
        $at ??= Carbon::now();

        if ($generator->isRunning()) {
            $this->commit($generator, $at);
            $generator->running_since = $at; // continue running from the corrected value
        }

        if ($metric === 'fuel') {
            $generator->fuel_level = $value;
            $generator->fuel_reading_at = $at;
        } elseif ($metric === 'run_hours') {
            $generator->run_hours = $value;
            $generator->run_hours_reading_at = $at;
        } else { // battery
            $generator->battery_voltage = $value;
            $generator->battery_reading_at = $at;
        }

        $generator->save();

        return $generator->readings()->create([
            'metric' => $metric,
            'value' => $value,
            'note' => $note,
            'recorded_at' => $at,
        ]);
    }

    /** Fold the open running interval (running_since → $at) into the stored columns. */
    protected function commit(Generator $generator, Carbon $at): void
    {
        $hours = $this->runningHoursSince($generator, $at);
        if ($hours <= 0) {
            return;
        }

        $generator->run_hours = round((float) $generator->run_hours + $hours, 1);
        $generator->run_hours_reading_at = $at;

        if ($generator->fuel_level !== null && $generator->fuel_burn_rate !== null) {
            $generator->fuel_level = round(
                max(0.0, (float) $generator->fuel_level - (float) $generator->fuel_burn_rate * $hours),
                1,
            );
            $generator->fuel_reading_at = $at;
        }
    }

    /** Hours elapsed on the open running interval up to $now (0 when not running). */
    protected function runningHoursSince(Generator $generator, Carbon $now): float
    {
        if (! $generator->isRunning()) {
            return 0.0;
        }

        $seconds = $now->getTimestamp() - $generator->running_since->getTimestamp();

        return max(0.0, $seconds / 3600);
    }
}
