<?php

namespace Database\Factories;

use App\Models\Generator;
use App\Models\MaintenanceItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MaintenanceItem>
 */
class MaintenanceItemFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'generator_id' => Generator::factory(),
            'title' => fake()->randomElement([
                'Oil & filter change',
                'Air filter replacement',
                'Spark plug inspection',
            ]),
            'detail' => 'Every 200 run hours',
            'due_date' => fake()->dateTimeBetween('-5 days', '+30 days'),
            'completed_at' => null,
        ];
    }
}
