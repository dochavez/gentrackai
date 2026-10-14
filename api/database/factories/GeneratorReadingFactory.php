<?php

namespace Database\Factories;

use App\Models\Generator;
use App\Models\GeneratorReading;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GeneratorReading>
 */
class GeneratorReadingFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $metric = fake()->randomElement(GeneratorReading::METRICS);

        return [
            'generator_id' => Generator::factory(),
            'metric' => $metric,
            'value' => match ($metric) {
                'fuel' => fake()->numberBetween(0, 100),
                'run_hours' => fake()->numberBetween(0, 2000),
                default => fake()->randomFloat(1, 11, 14),
            },
            'note' => null,
            'recorded_at' => now(),
        ];
    }
}
