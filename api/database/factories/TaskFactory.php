<?php

namespace Database\Factories;

use App\Models\Generator;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'generator_id' => Generator::factory(),
            'assignee_id' => null,
            'title' => fake()->randomElement([
                'Oil & filter change',
                'Load bank test',
                'Replace air filter',
                'Inspect battery & terminals',
            ]),
            'due_date' => fake()->dateTimeBetween('-5 days', '+21 days'),
            'completed_at' => null,
        ];
    }
}
