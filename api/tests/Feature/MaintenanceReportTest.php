<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\MaintenanceItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_requires_authentication(): void
    {
        $this->getJson('/api/maintenance/report')->assertUnauthorized();
    }

    public function test_report_totals_completed_services(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        MaintenanceItem::factory()->for($generator)->create([
            'completed_at' => now()->subDays(5),
            'cost' => 95,
            'est_saved' => 42,
        ]);
        MaintenanceItem::factory()->for($generator)->create([
            'completed_at' => now()->subDays(10),
            'cost' => 40,
            'est_saved' => 18,
        ]);
        // Not completed — excluded.
        MaintenanceItem::factory()->for($generator)->create(['completed_at' => null]);

        Sanctum::actingAs($user);

        $this->getJson('/api/maintenance/report?period=6mo')
            ->assertOk()
            ->assertJsonPath('summary.services', 2)
            ->assertJsonPath('summary.totalPaidLabel', '$135')
            ->assertJsonPath('summary.estSavedLabel', '$60')
            ->assertJsonCount(2, 'services');
    }

    public function test_report_excludes_deleted_generators(): void
    {
        $user = User::factory()->create();
        $active = Generator::factory()->for($user)->create();
        $deleted = Generator::factory()->for($user)->create();
        MaintenanceItem::factory()->for($active)->create(['completed_at' => now()->subDay(), 'cost' => 100, 'est_saved' => 45]);
        MaintenanceItem::factory()->for($deleted)->create(['completed_at' => now()->subDay(), 'cost' => 500, 'est_saved' => 225]);

        $deleted->delete();

        Sanctum::actingAs($user);

        $this->getJson('/api/maintenance/report')
            ->assertOk()
            ->assertJsonPath('summary.services', 1)
            ->assertJsonPath('summary.totalPaidLabel', '$100');
    }

    public function test_report_respects_the_period_window(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        MaintenanceItem::factory()->for($generator)->create(['completed_at' => now()->subMonths(8), 'cost' => 200, 'est_saved' => 90]);

        Sanctum::actingAs($user);

        // 8 months ago is outside 6mo…
        $this->getJson('/api/maintenance/report?period=6mo')
            ->assertOk()
            ->assertJsonPath('summary.services', 0);

        // …but inside 1 year.
        $this->getJson('/api/maintenance/report?period=1y')
            ->assertOk()
            ->assertJsonPath('summary.services', 1);
    }

    public function test_report_pdf_downloads(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        MaintenanceItem::factory()->for($generator)->create(['completed_at' => now()->subDay(), 'cost' => 95, 'est_saved' => 42]);

        Sanctum::actingAs($user);

        $response = $this->get('/api/maintenance/report/pdf');

        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
    }
}
