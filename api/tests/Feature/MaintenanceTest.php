<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\MaintenanceItem;
use App\Models\User;
use App\Notifications\MaintenanceDueNotification;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_items_for_an_owned_generator(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create(['service_interval' => 'Oil @ 200 hrs']);
        MaintenanceItem::factory()->count(2)->for($generator)->create();

        Sanctum::actingAs($user);

        $this->getJson("/api/generators/{$generator->id}/maintenance")
            ->assertOk()
            ->assertJsonCount(2, 'items')
            ->assertJsonPath('recommendedCycle', 'Oil @ 200 hrs');
    }

    public function test_index_forbids_other_users_generator(): void
    {
        $generator = Generator::factory()->for(User::factory())->create();
        Sanctum::actingAs(User::factory()->create());

        $this->getJson("/api/generators/{$generator->id}/maintenance")->assertForbidden();
    }

    public function test_store_schedules_an_item_and_notifies_the_owner(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson("/api/generators/{$generator->id}/maintenance", [
            'title' => 'Oil & filter change',
            'due_date' => now()->addDays(3)->toDateString(),
        ])->assertCreated()->assertJsonPath('item.title', 'Oil & filter change');

        $this->assertDatabaseHas('maintenance_items', ['generator_id' => $generator->id, 'title' => 'Oil & filter change']);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $user->id, 'type' => 'maintenance']);
    }

    public function test_update_marks_a_service_done_with_cost_and_estimates_savings(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        $item = MaintenanceItem::factory()->for($generator)->create(['completed_at' => null]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/generators/{$generator->id}/maintenance/{$item->id}", [
            'done' => true,
            'cost' => 100,
        ])
            ->assertOk()
            ->assertJsonPath('item.done', true)
            ->assertJsonPath('item.costLabel', '$100');

        $item->refresh();
        $this->assertNotNull($item->completed_at);
        // Default savings multiplier is 0.45 (config/maintenance.php).
        $this->assertEqualsWithDelta(45, (float) $item->est_saved, 0.01);
    }

    public function test_update_reopens_a_completed_service(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        $item = MaintenanceItem::factory()->for($generator)->create([
            'completed_at' => now(),
            'cost' => 80,
            'est_saved' => 36,
        ]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/generators/{$generator->id}/maintenance/{$item->id}", ['done' => false])
            ->assertOk()
            ->assertJsonPath('item.done', false);

        $item->refresh();
        $this->assertNull($item->completed_at);
        $this->assertNull($item->cost);
        $this->assertNull($item->est_saved);
    }

    public function test_update_forbids_other_users_generator(): void
    {
        $generator = Generator::factory()->for(User::factory())->create();
        $item = MaintenanceItem::factory()->for($generator)->create();

        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/generators/{$generator->id}/maintenance/{$item->id}", ['done' => true])
            ->assertForbidden();
    }

    public function test_store_assigns_to_a_teammate_and_notifies_them(): void
    {
        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        app(Teams::class)->attach($assignee, $owner->organization, 'member');
        $generator = Generator::factory()->for($owner)->create();

        Sanctum::actingAs($owner);

        $this->postJson("/api/generators/{$generator->id}/maintenance", [
            'title' => 'Coolant flush',
            'due_date' => now()->addDays(5)->toDateString(),
            'assignee_id' => $assignee->id,
        ])
            ->assertCreated()
            ->assertJsonPath('item.assigneeName', $assignee->name)
            ->assertJsonPath('item.assignedToMe', false);

        $this->assertDatabaseHas('maintenance_items', [
            'generator_id' => $generator->id,
            'assignee_id' => $assignee->id,
            'title' => 'Coolant flush',
        ]);
        // The assignee is notified; the creator still gets their own "scheduled" row.
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $assignee->id,
            'type' => 'maintenance',
            'title' => 'Maintenance assigned',
        ]);
    }

    public function test_store_rejects_an_assignee_outside_the_organization(): void
    {
        $owner = User::factory()->create();
        $outsider = User::factory()->create(); // in their own org, not the owner's
        $generator = Generator::factory()->for($owner)->create();

        Sanctum::actingAs($owner);

        $this->postJson("/api/generators/{$generator->id}/maintenance", [
            'title' => 'Belt inspection',
            'assignee_id' => $outsider->id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('assignee_id');
    }

    public function test_send_reminders_command_notifies_the_assignee_once(): void
    {
        NotificationFacade::fake();

        $owner = User::factory()->create();
        $assignee = User::factory()->create();
        app(Teams::class)->attach($assignee, $owner->organization, 'member');
        $generator = Generator::factory()->for($owner)->create();

        $item = MaintenanceItem::factory()->for($generator)->create([
            'user_id' => $owner->id,
            'assignee_id' => $assignee->id,
            'due_date' => today(),
            'completed_at' => null,
            'reminded_at' => null,
        ]);

        $this->artisan('maintenance:send-reminders')->assertSuccessful();

        NotificationFacade::assertSentTo($assignee, MaintenanceDueNotification::class);
        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $assignee->id,
            'type' => 'maintenance',
            'title' => 'Maintenance due',
        ]);
        $this->assertNotNull($item->fresh()->reminded_at);

        // Running again must not re-notify — reminded_at guards against repeats.
        NotificationFacade::fake();
        $this->artisan('maintenance:send-reminders')->assertSuccessful();
        NotificationFacade::assertNothingSent();
    }

    public function test_send_reminders_command_skips_unassigned_and_completed_items(): void
    {
        NotificationFacade::fake();

        $owner = User::factory()->create();
        $generator = Generator::factory()->for($owner)->create();

        // Due but unassigned → nobody to remind.
        MaintenanceItem::factory()->for($generator)->create([
            'user_id' => $owner->id,
            'assignee_id' => null,
            'due_date' => today(),
            'completed_at' => null,
        ]);
        // Assigned and due but already completed → nothing to do.
        MaintenanceItem::factory()->for($generator)->create([
            'user_id' => $owner->id,
            'assignee_id' => $owner->id,
            'due_date' => today(),
            'completed_at' => now(),
        ]);

        $this->artisan('maintenance:send-reminders')->assertSuccessful();

        NotificationFacade::assertNothingSent();
    }
}
