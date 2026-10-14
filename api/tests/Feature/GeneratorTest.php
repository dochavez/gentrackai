<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\StructuredResponseFake;
use Tests\TestCase;

class GeneratorTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/generators')->assertUnauthorized();
    }

    public function test_index_returns_only_the_authenticated_users_generators(): void
    {
        $user = User::factory()->create();
        Generator::factory()->count(2)->for($user)->create();
        Generator::factory()->for(User::factory())->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/generators')
            ->assertOk()
            ->assertJsonCount(2, 'generators');
    }

    public function test_store_adds_a_generator_to_the_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/generators', [
            'name' => 'Generac Guardian',
            'manufacturer' => 'Generac',
            'rated_power' => '24 kW',
        ])
            ->assertCreated()
            ->assertJsonPath('generator.name', 'Generac Guardian')
            ->assertJsonPath('generator.manufacturer', 'Generac');

        $this->assertDatabaseHas('generators', [
            'user_id' => $user->id,
            'name' => 'Generac Guardian',
        ]);
    }

    public function test_store_requires_a_name(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators', ['manufacturer' => 'Generac'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_show_forbids_other_users_generators(): void
    {
        $generator = Generator::factory()->for(User::factory())->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/generators/{$generator->id}")->assertForbidden();
    }

    public function test_scan_returns_extracted_specs(): void
    {
        Prism::fake([
            StructuredResponseFake::make()->withStructured([
                'is_generator' => true,
                'confidence' => 97,
                'name' => 'Generac Guardian',
                'manufacturer' => 'Generac',
                'model_number' => '7210',
                'rated_power' => '24 kW',
                'fuel_type' => 'Natural gas / LP',
                'type' => 'Automatic standby',
                'serial_number' => '30271-A88214',
                'transfer_switch' => '200A',
                'service_interval' => 'Oil @ 200 hrs',
            ]),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators/scan', [
            'image' => UploadedFile::fake()->image('label.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('result.name', 'Generac Guardian')
            ->assertJsonPath('result.confidence', 97);
    }

    public function test_scan_uses_a_gemini3_compatible_thinking_option(): void
    {
        // Regression: Gemini 3 (which `gemini-flash-latest` now resolves to)
        // rejects the old `thinkingBudget: 0` with a 400 INVALID_ARGUMENT, which
        // broke every scan. We must send `thinkingLevel` instead.
        $fake = Prism::fake([
            StructuredResponseFake::make()->withStructured([
                'is_generator' => true,
                'confidence' => 90,
            ]),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators/scan', [
            'image' => UploadedFile::fake()->image('label.jpg'),
        ])->assertOk();

        $fake->assertRequest(function (array $requests): void {
            $options = $requests[0]->providerOptions();

            $this->assertArrayNotHasKey('thinkingBudget', $options);
            $this->assertSame('low', $options['thinkingLevel'] ?? null);
        });
    }

    public function test_scan_retries_without_the_thinking_option_when_gemini_rejects_it(): void
    {
        // Drive the real Prism -> Gemini payload (Prism::fake bypasses it, which
        // is how the bad option shipped). First call 400s on the thinking hint,
        // exactly like Gemini 3 does; the extractor must retry without it.
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::sequence()
                ->push([
                    'error' => [
                        'code' => 400,
                        'message' => 'Request contains an invalid argument.',
                        'status' => 'INVALID_ARGUMENT',
                    ],
                ], 400)
                ->push([
                    'candidates' => [[
                        'content' => ['parts' => [[
                            'text' => json_encode(['is_generator' => true, 'confidence' => 88, 'name' => 'Kohler']),
                        ]]],
                        'finishReason' => 'STOP',
                    ]],
                    'usageMetadata' => ['promptTokenCount' => 10, 'candidatesTokenCount' => 8, 'totalTokenCount' => 18],
                    'modelVersion' => 'gemini-3.6-flash',
                ], 200),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators/scan', [
            'image' => UploadedFile::fake()->image('label.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('result.name', 'Kohler');

        $requests = Http::recorded();

        // Exactly two calls: the rejected thinking hint, then the retry without it.
        $this->assertCount(2, $requests);
        $this->assertSame('low', data_get($requests[0][0]->data(), 'generationConfig.thinkingConfig.thinkingLevel'));
        $this->assertNull(data_get($requests[1][0]->data(), 'generationConfig.thinkingConfig'));
    }

    public function test_scan_rejects_a_non_generator_photo(): void
    {
        Prism::fake([
            StructuredResponseFake::make()->withStructured([
                'is_generator' => false,
                'confidence' => 10,
            ]),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators/scan', [
            'image' => UploadedFile::fake()->image('cat.jpg'),
        ])->assertUnprocessable();
    }

    public function test_scan_requires_an_image(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators/scan', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('image');
    }

    public function test_scan_accepts_a_readable_label_even_if_not_flagged_a_generator(): void
    {
        Prism::fake([
            StructuredResponseFake::make()->withStructured([
                'is_generator' => false,
                'confidence' => 55,
                'manufacturer' => 'Generac',
                'model_number' => 'G0072109',
                'serial_number' => '3010634316',
            ]),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators/scan', [
            'image' => UploadedFile::fake()->image('label.jpg'),
        ])
            ->assertOk()
            ->assertJsonPath('result.model_number', 'G0072109');
    }

    public function test_store_rejects_a_duplicate_serial_in_the_organization(): void
    {
        $user = User::factory()->create();
        Generator::factory()->for($user)->create(['serial_number' => 'SN-123']);

        Sanctum::actingAs($user);

        $this->postJson('/api/generators', ['name' => 'Duplicate', 'serial_number' => 'SN-123'])
            ->assertStatus(409)
            ->assertJsonPath('message', 'This generator is already in your fleet.');

        $this->assertSame(1, $user->organization->generators()->count());
    }

    public function test_store_allows_the_same_serial_in_a_different_organization(): void
    {
        $other = User::factory()->create();
        Generator::factory()->for($other)->create(['serial_number' => 'SN-9']);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/generators', ['name' => 'Mine', 'serial_number' => 'SN-9'])->assertCreated();
    }

    public function test_store_allows_multiple_generators_without_a_serial(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/generators', ['name' => 'One'])->assertCreated();
        $this->postJson('/api/generators', ['name' => 'Two'])->assertCreated();
    }

    public function test_update_edits_details(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create(['location' => 'Garage']);

        Sanctum::actingAs($user);

        $this->patchJson("/api/generators/{$generator->id}", [
            'name' => 'Backup Genset',
            'location' => 'Warehouse B',
        ])
            ->assertOk()
            ->assertJsonPath('generator.name', 'Backup Genset')
            ->assertJsonPath('generator.location', 'Warehouse B');

        $this->assertDatabaseHas('generators', [
            'id' => $generator->id,
            'name' => 'Backup Genset',
            'location' => 'Warehouse B',
        ]);
    }

    public function test_update_forbids_other_users_generator(): void
    {
        $generator = Generator::factory()->for(User::factory())->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/generators/{$generator->id}", ['name' => 'Hijacked'])->assertForbidden();
    }

    public function test_update_rejects_an_invalid_status(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->patchJson("/api/generators/{$generator->id}", ['status' => 'exploded'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');
    }

    public function test_update_logs_a_reading_when_setting_a_metric(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create(['status' => 'offline', 'running_since' => null]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/generators/{$generator->id}", ['fuel_level' => 55])
            ->assertOk()
            ->assertJsonPath('generator.fuelLevel', 55);

        $this->assertDatabaseHas('generator_readings', [
            'generator_id' => $generator->id,
            'metric' => 'fuel',
            'value' => 55,
        ]);
    }

    public function test_destroy_soft_deletes_and_hides_the_generator(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->deleteJson("/api/generators/{$generator->id}")->assertNoContent();

        $this->assertSoftDeleted('generators', ['id' => $generator->id]);
        $this->getJson('/api/generators')->assertOk()->assertJsonCount(0, 'generators');
        $this->getJson("/api/generators/{$generator->id}")->assertNotFound();
    }

    public function test_destroy_forbids_other_users_generator(): void
    {
        $generator = Generator::factory()->for(User::factory())->create();
        Sanctum::actingAs(User::factory()->create());

        $this->deleteJson("/api/generators/{$generator->id}")->assertForbidden();
        $this->assertNotSoftDeleted('generators', ['id' => $generator->id]);
    }
}
