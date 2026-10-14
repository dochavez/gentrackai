<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\Task;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/tasks')->assertUnauthorized();
    }

    public function test_index_returns_the_users_tasks(): void
    {
        $user = User::factory()->create();
        Task::factory()->count(2)->for($user)->create();
        Task::factory()->for(User::factory())->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/tasks')->assertOk()->assertJsonCount(2, 'tasks');
    }

    public function test_overdue_filter_returns_only_past_open_tasks(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create(['due_date' => now()->subDays(3), 'completed_at' => null]);
        Task::factory()->for($user)->create(['due_date' => now()->addDays(3)]);

        Sanctum::actingAs($user);

        $this->getJson('/api/tasks?filter=overdue')
            ->assertOk()
            ->assertJsonCount(1, 'tasks')
            ->assertJsonPath('counts.overdue', 1);
    }

    public function test_store_creates_a_task_for_an_owned_generator(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/tasks', [
            'title' => 'Oil & filter change',
            'generator_id' => $generator->id,
            'due_date' => now()->addDays(2)->toDateString(),
        ])->assertCreated()->assertJsonPath('task.title', 'Oil & filter change');

        $this->assertDatabaseHas('tasks', ['user_id' => $user->id, 'title' => 'Oil & filter change']);
    }

    public function test_store_rejects_a_generator_the_user_does_not_own(): void
    {
        $user = User::factory()->create();
        $foreign = Generator::factory()->for(User::factory())->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/tasks', ['title' => 'X', 'generator_id' => $foreign->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('generator_id');
    }

    public function test_store_notifies_the_assignee(): void
    {
        $user = User::factory()->create();
        $generator = Generator::factory()->for($user)->create();
        // A teammate in the same organization.
        $mate = User::factory()->create();
        app(Teams::class)->attach($mate, $user->organization, 'member');

        Sanctum::actingAs($user);

        $this->postJson('/api/tasks', [
            'title' => 'Load bank test',
            'generator_id' => $generator->id,
            'assignee_id' => $mate->id,
        ])->assertCreated();

        $this->assertDatabaseHas('app_notifications', ['user_id' => $mate->id, 'type' => 'task']);
    }

    public function test_update_toggles_done(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['completed_at' => null]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/tasks/{$task->id}", ['done' => true])
            ->assertOk()
            ->assertJsonPath('task.done', true);

        $this->assertNotNull($task->fresh()->completed_at);
    }

    public function test_update_forbids_other_users_task(): void
    {
        $task = Task::factory()->for(User::factory())->create();
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/tasks/{$task->id}", ['done' => true])->assertForbidden();
    }

    public function test_index_excludes_tasks_of_deleted_generators(): void
    {
        $user = User::factory()->create();
        $active = Generator::factory()->for($user)->create();
        $deleted = Generator::factory()->for($user)->create();
        Task::factory()->for($user)->create(['generator_id' => $active->id]);
        Task::factory()->for($user)->create(['generator_id' => $deleted->id]);

        $deleted->delete();

        Sanctum::actingAs($user);

        $this->getJson('/api/tasks')
            ->assertOk()
            ->assertJsonCount(1, 'tasks')
            ->assertJsonPath('counts.all', 1);
    }
}
