<?php

namespace Database\Factories;

use App\Models\Generator;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Generator>
 */
class GeneratorFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(['Honda EU7000is', 'Generac Guardian', 'Kohler 14RESAL']),
            'manufacturer' => fake()->randomElement(['Honda', 'Generac', 'Kohler']),
            'model_number' => (string) fake()->numberBetween(1000, 9999),
            'rated_power' => fake()->numberBetween(5, 30).' kW',
            'fuel_type' => fake()->randomElement(['Gasoline', 'Natural gas / LP', 'Diesel']),
            'type' => fake()->randomElement(['Portable inverter', 'Automatic standby']),
            'serial_number' => fake()->bothify('#####-?#####'),
            'status' => 'running',
            'run_hours' => fake()->numberBetween(0, 800),
            'confidence' => fake()->numberBetween(80, 99),
        ];
    }
}
