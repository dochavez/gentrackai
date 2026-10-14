<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GeneratorReadingTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $generator = Generator::factory()->create();

        $this->getJson("/api/generators/{$generator->id}/readings")->assertUnauthorized();
    }

    public function test_run_hours_project_while_running(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create([
            'status' => 'running',
            'run_hours' => 100,
            'running_since' => now()->subHours(2),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/generators/{$generator->id}")->assertOk();

        $this->assertEqualsWithDelta(102, $response->json('generator.runHours'), 0.05);
        $response->assertJsonPath('generator.isRunning', true)
            ->assertJsonPath('generator.runHoursCaption', 'Updating live');
    }

    public function test_fuel_drains_while_running(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create([
            'status' => 'running',
            'fuel_level' => 80,
            'fuel_burn_rate' => 10, // 10% per running hour
            'running_since' => now()->subHours(2),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/generators/{$generator->id}")->assertOk();

        $this->assertEqualsWithDelta(60, $response->json('generator.fuelLevel'), 0.1);
    }

    public function test_values_freeze_when_not_running(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create([
            'status' => 'offline',
            'run_hours' => 250,
            'running_since' => null,
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/generators/{$generator->id}")
            ->assertOk()
            ->assertJsonPath('generator.runHours', 250)
            ->assertJsonPath('generator.isRunning', false);
    }

    public function test_stopping_commits_the_open_interval(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create([
            'status' => 'running',
            'run_hours' => 100,
            'fuel_level' => 80,
            'fuel_burn_rate' => 10,
            'running_since' => now()->subHours(2),
        ]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/generators/{$generator->id}", ['status' => 'offline'])->assertOk();

        $generator->refresh();
        $this->assertEqualsWithDelta(102, (float) $generator->run_hours, 0.05);
        $this->assertEqualsWithDelta(60, (float) $generator->fuel_level, 0.1);
        $this->assertNull($generator->running_since);
        $this->assertSame('offline', $generator->status);
    }

    public function test_store_logs_a_reading_and_returns_a_fresh_snapshot(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create(['status' => 'offline', 'running_since' => null]);

        Sanctum::actingAs($user);

        $this->postJson("/api/generators/{$generator->id}/readings", [
            'metric' => 'battery',
            'value' => 12.6,
        ])
            ->assertCreated()
            ->assertJsonPath('reading.metricLabel', 'Battery')
            ->assertJsonPath('reading.valueLabel', '12.6 V')
            ->assertJsonPath('generator.batteryVoltage', 12.6);

        $this->assertDatabaseHas('generator_readings', [
            'generator_id' => $generator->id,
            'metric' => 'battery',
        ]);
    }

    public function test_store_battery_reading_yields_an_as_of_caption(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $caption = $this->postJson("/api/generators/{$generator->id}/readings", [
            'metric' => 'battery',
            'value' => 13.1,
        ])->assertCreated()->json('generator.batteryCaption');

        $this->assertStringContainsString('as of', $caption);
    }

    public function test_recording_run_hours_corrects_the_odometer(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create([
            'status' => 'running',
            'run_hours' => 100,
            'running_since' => now()->subHours(2),
        ]);

        Sanctum::actingAs($user);

        // Reading overwrites the projected value and re-anchors from now.
        $response = $this->postJson("/api/generators/{$generator->id}/readings", [
            'metric' => 'run_hours',
            'value' => 500,
        ])->assertCreated();

        $this->assertEqualsWithDelta(500, $response->json('generator.runHours'), 0.5);
        $this->assertEqualsWithDelta(500, (float) $generator->fresh()->run_hours, 0.5);
    }

    public function test_index_returns_the_generators_readings(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        $generator->readings()->createMany([
            ['metric' => 'battery', 'value' => 12.6, 'recorded_at' => now()->subDay()],
            ['metric' => 'fuel', 'value' => 80, 'recorded_at' => now()],
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/generators/{$generator->id}/readings")
            ->assertOk()
            ->assertJsonCount(2, 'readings');
    }

    public function test_index_filters_by_metric(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        $generator->readings()->createMany([
            ['metric' => 'battery', 'value' => 12.6, 'recorded_at' => now()],
            ['metric' => 'fuel', 'value' => 80, 'recorded_at' => now()],
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/generators/{$generator->id}/readings?metric=fuel")
            ->assertOk()
            ->assertJsonCount(1, 'readings')
            ->assertJsonPath('readings.0.metric', 'fuel');
    }

    public function test_store_forbids_a_generator_the_user_does_not_own(): void
    {
        $generator = Generator::factory()->for(User::factory())->create();
        Sanctum::actingAs(User::factory()->create());

        $this->postJson("/api/generators/{$generator->id}/readings", ['metric' => 'battery', 'value' => 12.6])
            ->assertForbidden();
    }

    public function test_store_validates_the_metric(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/generators/{$generator->id}/readings", ['metric' => 'temperature', 'value' => 5])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('metric');
    }

    public function test_store_rejects_a_fuel_reading_above_full(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/generators/{$generator->id}/readings", ['metric' => 'fuel', 'value' => 150])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('value');
    }
}
