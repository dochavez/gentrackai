<?php

namespace App\Services;

use App\Models\Insight;
use App\Models\Organization;
use App\Support\GeminiRetry;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Schema\ArraySchema;
use Prism\Prism\Schema\EnumSchema;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;

/**
 * Generates the AI maintenance recommendation for an organization's fleet via
 * Gemini (through Prism) and persists it as the cached `Insight`. This is the
 * ONLY place tokens are spent — it runs from a queued job, never on a read.
 */
class InsightGenerator
{
    public function __construct(private FleetAnalytics $analytics) {}

    public function generate(Organization $organization): Insight
    {
        $insight = $organization->insight()->firstOrCreate([]);
        $insight->update(['generating' => true]);

        try {
            $response = Prism::structured()
                ->using(Provider::Gemini, config('services.gemini.model'))
                ->withClientRetry(...GeminiRetry::options())
                ->withSchema($this->schema())
                ->withSystemPrompt(
                    'You are a maintenance advisor for backup/standby generators. Given a fleet snapshot, '.
                    'produce 1 to 3 concise, actionable maintenance recommendations, most important first. '.
                    'Base everything strictly on the data provided — never invent model numbers, dates, or '.
                    'facts that are not present. Keep each recommendation to one or two sentences.'
                )
                ->withPrompt(
                    "Current fleet snapshot (JSON). Recommend maintenance actions.\n\n".
                    (string) json_encode($this->facts($organization), JSON_PRETTY_PRINT)
                )
                ->asStructured();

            /** @var array<string, mixed> $data */
            $data = $response->structured ?? [];
            $usage = $response->usage ?? null;

            $insight->update([
                'payload' => ['recommendations' => $data['recommendations'] ?? []],
                'input_digest' => $this->analytics->digest($organization),
                'generated_at' => now(),
                'generating' => false,
                'model' => config('services.gemini.model'),
                'prompt_tokens' => $usage?->promptTokens,
                'completion_tokens' => $usage?->completionTokens,
            ]);
        } catch (\Throwable $e) {
            $insight->update(['generating' => false]);
            throw $e;
        }

        return $insight->refresh();
    }

    /**
     * The fleet facts handed to the model — the deterministic analytics plus a
     * per-generator summary. The current month lets it reason about seasonality.
     *
     * @return array<string, mixed>
     */
    protected function facts(Organization $organization): array
    {
        return [
            'month' => now()->format('F'),
            'analytics' => $this->analytics->build($organization),
            'generators' => $organization->generators()->get()->map(fn ($g) => [
                'name' => $g->name,
                'status' => $g->status,
                'runHours' => (float) $g->run_hours,
                'fuelLevel' => $g->fuel_level,
                'batteryVoltage' => $g->battery_voltage,
                'fuelBurnRate' => $g->fuel_burn_rate,
                'serviceInterval' => $g->service_interval,
            ])->all(),
        ];
    }

    protected function schema(): ObjectSchema
    {
        return new ObjectSchema(
            name: 'insights',
            description: 'Maintenance recommendations for the fleet.',
            properties: [
                new ArraySchema(
                    name: 'recommendations',
                    description: '1 to 3 concise, actionable recommendations, most important first.',
                    items: new ObjectSchema(
                        name: 'recommendation',
                        description: 'A single maintenance recommendation.',
                        properties: [
                            new StringSchema('title', 'Short title, e.g. "Schedule oil change".'),
                            new StringSchema('body', 'One or two sentences: the action and why it matters.'),
                            new EnumSchema('severity', 'How urgent it is.', ['info', 'warning', 'critical']),
                            new StringSchema('generatorName', 'The generator it refers to, or null for fleet-wide.', nullable: true),
                        ],
                        requiredFields: ['title', 'body', 'severity'],
                    ),
                ),
            ],
            requiredFields: ['recommendations'],
        );
    }
}
