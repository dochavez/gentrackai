<?php

namespace App\Services;

use App\Support\GeminiRetry;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Exceptions\PrismException;
use Prism\Prism\Exceptions\PrismProviderOverloadedException;
use Prism\Prism\Exceptions\PrismRateLimitedException;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Schema\BooleanSchema;
use Prism\Prism\Schema\NumberSchema;
use Prism\Prism\Schema\ObjectSchema;
use Prism\Prism\Schema\StringSchema;
use Prism\Prism\ValueObjects\Media\Image;

class GeneratorLabelExtractor
{
    /**
     * Read a generator's nameplate/label from a photo and return structured
     * specs via Gemini (through Prism). Tries the configured vision model first;
     * if it fails (rate-limited, unavailable/404, etc.) it falls back to the
     * base model so a bad vision-model setting can't break scanning. Values not
     * visible in the image come back as null — the model never invents anything.
     *
     * @return array<string, mixed>
     */
    public function extract(UploadedFile $image): array
    {
        $media = Image::fromLocalPath($image->getRealPath(), $image->getMimeType());
        $visionModel = (string) config('services.gemini.vision_model');
        $fallbackModel = (string) config('services.gemini.model');

        try {
            return $this->run($visionModel, $media);
        } catch (PrismException $e) {
            if ($visionModel === $fallbackModel) {
                throw $e;
            }

            Log::warning('Vision model failed; falling back to base model.', [
                'vision_model' => $visionModel,
                'fallback_model' => $fallbackModel,
                'error' => $e->getMessage(),
            ]);

            return $this->run($fallbackModel, $media);
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function run(string $model, Image $media): array
    {
        // Reading a nameplate is an extraction task, not a reasoning one, so we
        // ask Gemini to keep thinking minimal — a vision+structured call at full
        // thinking can push past the request timeout. `thinkingLevel: low` is
        // Gemini 3's knob for this; the older `thinkingBudget: 0` is rejected by
        // Gemini 3 with a 400 INVALID_ARGUMENT.
        try {
            return $this->call($model, $media, ['thinkingLevel' => 'low']);
        } catch (PrismRateLimitedException|PrismProviderOverloadedException $e) {
            // Transient, whole-provider failures — the thinking option isn't the
            // cause, so let them surface (the caller turns them into a 429/503).
            throw $e;
        } catch (PrismException $e) {
            // The configured model is a floating "-latest" alias, so Google can
            // move it to a generation that rejects our speed hint. A tuning knob
            // must never break scanning — retry once on the provider defaults.
            Log::warning('Gemini rejected the thinking option; retrying with defaults.', [
                'model' => $model,
                'error' => $e->getMessage(),
            ]);

            return $this->call($model, $media, []);
        }
    }

    /**
     * @param  array<string, mixed>  $providerOptions
     * @return array<string, mixed>
     */
    protected function call(string $model, Image $media, array $providerOptions): array
    {
        $response = Prism::structured()
            ->using(Provider::Gemini, $model)
            ->withClientRetry(...GeminiRetry::options())
            ->withProviderOptions($providerOptions)
            ->withSchema($this->schema())
            ->withSystemPrompt(
                'You read equipment nameplate/spec labels — especially electrical generator (genset) '.
                'nameplates — from photos and return structured specifications. Read ALL visible text '.
                'carefully, even when the photo is angled, has glare/reflection, is dim, or only partially '.
                'legible. Extract every field you can make out; use null only when a field is genuinely '.
                'unreadable. Never invent values. Set is_generator=true whenever the image shows an equipment '.
                'nameplate or spec label (it may not literally say "generator"); set it false only when the '.
                'image clearly is not a nameplate at all (e.g. a person, scenery, an unrelated object).'
            )
            ->withPrompt(
                'Extract the specifications from this nameplate photo. Pay special attention to the MODEL '.
                'and SERIAL numbers.',
                [$media],
            )
            ->asStructured();

        /** @var array<string, mixed> $data */
        $data = $response->structured ?? [];

        return $data;
    }

    protected function schema(): ObjectSchema
    {
        return new ObjectSchema(
            name: 'generator',
            description: 'Details read from a generator nameplate/label photo.',
            properties: [
                new BooleanSchema('is_generator', 'True only if the photo shows a generator nameplate/label.'),
                new NumberSchema('confidence', 'Confidence the identification is correct, from 0 to 100.'),
                new StringSchema('name', 'Concise display name, e.g. "Generac Guardian".', nullable: true),
                new StringSchema('manufacturer', 'Manufacturer / brand, e.g. "Generac".', nullable: true),
                new StringSchema('model_number', 'Model number or series, e.g. "7210".', nullable: true),
                new StringSchema('rated_power', 'Rated output including unit, e.g. "24 kW".', nullable: true),
                new StringSchema('fuel_type', 'Fuel type, e.g. "Natural gas / LP".', nullable: true),
                new StringSchema('type', 'Type, e.g. "Automatic standby" or "Portable inverter".', nullable: true),
                new StringSchema('serial_number', 'Serial number if visible.', nullable: true),
                new StringSchema('transfer_switch', 'Transfer switch rating if visible, e.g. "200A".', nullable: true),
                new StringSchema('service_interval', 'Service interval if visible, e.g. "Oil @ 200 hrs".', nullable: true),
            ],
            requiredFields: ['is_generator', 'confidence'],
        );
    }
}
