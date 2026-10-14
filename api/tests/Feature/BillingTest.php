<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_billing_status_reports_the_free_plan_and_usage(): void
    {
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/billing')
            ->assertOk()
            ->assertJsonPath('plan', 'free')
            ->assertJsonPath('subscribed', false)
            ->assertJsonPath('usage.generators', 1)
            ->assertJsonPath('usage.members', 1)
            ->assertJsonPath('canManageBilling', true);
    }

    public function test_billing_status_reports_pro_when_subscribed(): void
    {
        $user = User::factory()->create();
        $this->subscribeToPro($user->organization);

        Sanctum::actingAs($user);

        $this->getJson('/api/billing')
            ->assertOk()
            ->assertJsonPath('plan', 'pro')
            ->assertJsonPath('subscribed', true)
            ->assertJsonPath('limits.generators', null); // unlimited
    }

    public function test_free_plan_caps_the_fleet(): void
    {
        config(['plans.free.generators' => 2]);
        $user = User::factory()->create();
        Generator::factory()->count(2)->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/generators', ['name' => 'Third unit'])
            ->assertStatus(402)
            ->assertJsonPath('upgradeRequired', true)
            ->assertJsonPath('feature', 'generators');
    }

    public function test_pro_plan_lifts_the_fleet_cap(): void
    {
        config(['plans.free.generators' => 1]);
        $user = User::factory()->create();
        $this->subscribeToPro($user->organization);
        Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        $this->postJson('/api/generators', ['name' => 'Second unit'])->assertCreated();
    }

    public function test_free_plan_caps_team_members(): void
    {
        config(['plans.free.members' => 1]);
        Notification::fake();
        $owner = User::factory()->create(); // owner is the org's only member (1/1)

        Sanctum::actingAs($owner);

        $this->postJson('/api/organization/invitations', ['email' => 'new@example.com', 'role' => 'member'])
            ->assertStatus(402)
            ->assertJsonPath('feature', 'members');
    }

    public function test_pro_plan_lifts_the_member_cap(): void
    {
        config(['plans.free.members' => 1]);
        Notification::fake();
        $owner = User::factory()->create();
        $this->subscribeToPro($owner->organization);

        Sanctum::actingAs($owner);

        $this->postJson('/api/organization/invitations', ['email' => 'new@example.com', 'role' => 'member'])
            ->assertStatus(202);
    }

    public function test_free_plan_caps_daily_chat(): void
    {
        config(['plans.free.chat_daily' => 1]);
        $user = User::factory()->create();
        $conversation = $user->chatConversation()->create([]);
        $conversation->messages()->create(['role' => 'user', 'content' => 'first message today']);

        Sanctum::actingAs($user);

        $this->postJson('/api/chat', ['message' => 'second message today'])
            ->assertStatus(402)
            ->assertJsonPath('feature', 'chat');
    }

    public function test_only_the_owner_can_start_checkout(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        // attach() upserts the pivot and switches the member's active org.
        app(Teams::class)->attach($member, $owner->organization, 'member');

        Sanctum::actingAs($member);

        $this->postJson('/api/billing/checkout')->assertForbidden();
    }

    public function test_billing_portal_requires_an_existing_customer(): void
    {
        $owner = User::factory()->create(); // owner, but never subscribed → no stripe_id

        Sanctum::actingAs($owner);

        $this->postJson('/api/billing/portal')->assertStatus(409);
    }

    public function test_enforcement_switch_off_lifts_all_gates(): void
    {
        config(['plans.enforce' => false, 'plans.free.generators' => 1]);
        $user = User::factory()->create();
        Generator::factory()->for($user)->create();

        Sanctum::actingAs($user);

        // Over the nominal Free cap, but enforcement is off → still allowed.
        $this->postJson('/api/generators', ['name' => 'Second unit'])->assertCreated();
    }
}
