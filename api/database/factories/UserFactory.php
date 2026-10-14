<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Every user belongs to an organization. Unless one is already assigned,
     * give the new user their own (as owner, and active), matching real
     * registration.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            if ($user->current_organization_id !== null || $user->organizations()->exists()) {
                return;
            }

            $organization = Organization::create([
                'name' => $user->name."'s Team",
                'owner_id' => $user->id,
            ]);

            $user->organizations()->attach($organization->id, ['role' => 'owner']);
            $user->forceFill(['current_organization_id' => $organization->id])->save();
        });
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
