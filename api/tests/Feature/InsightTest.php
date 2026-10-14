<?php

namespace Tests\Feature;

use App\Jobs\GenerateInsightsJob;
use App\Models\Generator;
use App\Models\User;
use App\Services\FleetAnalytics;
use App\Services\InsightGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\StructuredResponseFake;
use Tests\TestCase;

class InsightTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/insights')->assertUnauthorized();
    }

    public function test_index_returns_deterministic_analytics(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Generator::factory()->for($user)->create(['status' => 'running']);
        Generator::factory()->for($user)->create(['status' => 'offline']);

        Sanctum::actingAs($user);

        $this->getJson('/api/insights')
            ->assertOk()
            ->assertJsonPath('analytics.generatorCount', 2)
            ->assertJsonPath('analytics.healthScore', 85) // 100 − 15 (one offline)
            ->assertJsonPath('analytics.healthSubtext', '1 generator offline')
            ->assertJsonCount(4, 'analytics.weeklyRunHours');
    }

    public function test_index_does_not_call_gemini_and_enqueues_on_first_load(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();
        $this->subscribeToPro($user->organization);

        Sanctum::actingAs($user);

        $this->getJson('/api/insights')
            ->assertOk()
            ->assertJsonPath('ai', null)
            ->assertJsonPath('aiPending', true);

        Queue::assertPushed(GenerateInsightsJob::class);
    }

    public function test_index_serves_cached_ai_without_regenerating_when_fresh(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();
        $this->subscribeToPro($user->organization);

        $digest = app(FleetAnalytics::class)->digest($user->organization);
        $user->organization->insight()->create([
            'payload' => ['recommendations' => [['title' => 'Oil change', 'body' => 'Soon.', 'severity' => 'warning']]],
            'input_digest' => $digest,
            'generated_at' => now(),
            'generating' => false,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/insights')
            ->assertOk()
            ->assertJsonPath('aiPending', false)
            ->assertJsonPath('ai.recommendations.0.title', 'Oil change');

        Queue::assertNothingPushed();
    }

    public function test_index_enqueues_regeneration_when_digest_changed(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();
        $this->subscribeToPro($user->organization);

        $user->organization->insight()->create([
            'payload' => ['recommendations' => []],
            'input_digest' => 'a-stale-digest',
            'generated_at' => now()->subDays(2), // past the 24h min interval
            'generating' => false,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/insights')->assertOk();

        Queue::assertPushed(GenerateInsightsJob::class);
    }

    public function test_index_does_not_regenerate_within_min_interval(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();
        $this->subscribeToPro($user->organization);

        // Digest is stale, but it was generated 1h ago (< 24h min interval).
        $user->organization->insight()->create([
            'payload' => ['recommendations' => []],
            'input_digest' => 'a-stale-digest',
            'generated_at' => now()->subHour(),
            'generating' => false,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/insights')->assertOk();

        Queue::assertNothingPushed();
    }

    public function test_job_generates_and_persists_the_recommendation(): void
    {
        Prism::fake([
            StructuredResponseFake::make()->withStructured([
                'recommendations' => [
                    ['title' => 'Schedule oil change', 'body' => 'Approaching 200 hrs.', 'severity' => 'warning'],
                ],
            ]),
        ]);

        $user = User::factory()->create();
        Generator::factory()->for($user)->create();

        (new GenerateInsightsJob($user->organization->id))->handle(app(InsightGenerator::class));

        $insight = $user->organization->insight()->first();
        $this->assertNotNull($insight);
        $this->assertSame('Schedule oil change', $insight->payload['recommendations'][0]['title']);
        $this->assertNotNull($insight->input_digest);
        $this->assertNotNull($insight->generated_at);
        $this->assertFalse($insight->generating);
    }

    public function test_refresh_endpoint_queues_a_regeneration(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        $this->subscribeToPro($user->organization);

        Sanctum::actingAs($user);

        $this->postJson('/api/insights/refresh')->assertStatus(202)->assertJsonPath('status', 'queued');

        Queue::assertPushed(GenerateInsightsJob::class);
    }

    public function test_free_plan_locks_the_ai_recommendation(): void
    {
        Queue::fake();
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        // Deterministic analytics still return; the AI recommendation is locked.
        $this->getJson('/api/insights')
            ->assertOk()
            ->assertJsonPath('aiLocked', true)
            ->assertJsonPath('ai', null);

        // No Gemini work is queued for a Free org.
        Queue::assertNothingPushed();
    }

    public function test_free_plan_cannot_force_refresh(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/insights/refresh')
            ->assertStatus(402)
            ->assertJsonPath('upgradeRequired', true);
    }
}
