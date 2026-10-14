<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\Invitation;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    private function member(User $owner, string $role = 'member'): User
    {
        $user = User::factory()->create();
        app(Teams::class)->attach($user, $owner->organization, $role);

        return $user->refresh();
    }

    public function test_registering_creates_an_owned_organization(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Alex Doyle',
            'email' => 'alex@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'owner')
            ->assertJsonPath('user.canManageTeam', true);

        $user = User::where('email', 'alex@example.com')->first();
        $this->assertNotNull($user->organization_id);
        $this->assertDatabaseHas('organizations', ['id' => $user->organization_id, 'owner_id' => $user->id]);
    }

    public function test_registering_does_not_auto_join_a_pending_invite(): void
    {
        $owner = User::factory()->create();
        Invitation::create([
            'organization_id' => $owner->organization_id,
            'email' => 'newhire@example.com',
            'role' => 'admin',
            'token' => 'tok-'.uniqid(),
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(14),
        ]);

        $this->postJson('/api/register', [
            'name' => 'New Hire',
            'email' => 'newhire@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            // Lands in their OWN org as owner — not silently joined to the inviter.
            ->assertJsonPath('user.role', 'owner');

        $user = User::where('email', 'newhire@example.com')->first();
        $this->assertNotSame($owner->organization_id, $user->organization_id);
        // The invitation stays pending for them to accept explicitly in-app.
        $this->assertNull(Invitation::where('email', 'newhire@example.com')->first()->accepted_at);
    }

    public function test_accepting_an_invite_adds_a_membership_and_keeps_the_previous_one(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create();
        $ownOrg = $invitee->organization_id;

        $invitation = Invitation::create([
            'organization_id' => $owner->organization_id,
            'email' => $invitee->email,
            'role' => 'member',
            'token' => 'tok-'.uniqid(),
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(14),
        ]);

        Sanctum::actingAs($invitee);
        $this->patchJson("/api/invitations/{$invitation->id}")->assertOk();

        $invitee->refresh();
        // Active org switched to the joined one, but the personal org membership remains.
        $this->assertSame($owner->organization_id, $invitee->current_organization_id);
        $this->assertTrue($invitee->belongsToOrganization($ownOrg));
        $this->assertTrue($invitee->belongsToOrganization($owner->organization_id));
        $this->assertCount(2, $invitee->organizations);
    }

    public function test_user_can_switch_between_their_organizations(): void
    {
        $owner = User::factory()->create();
        $member = $this->member($owner);        // now belongs to owner's org (active) + their own
        $ownOrg = $member->organizations->firstWhere('id', '!=', $owner->organization_id)->id;

        Sanctum::actingAs($member);

        $this->postJson('/api/organization/switch', ['organization_id' => $ownOrg])
            ->assertOk()
            ->assertJsonPath('user.organizationId', (string) $ownOrg)
            ->assertJsonPath('user.role', 'owner');

        $this->assertSame($ownOrg, $member->fresh()->current_organization_id);
    }

    public function test_cannot_switch_to_an_organization_you_do_not_belong_to(): void
    {
        $outsider = User::factory()->create();
        $other = User::factory()->create();

        Sanctum::actingAs($outsider);

        $this->postJson('/api/organization/switch', ['organization_id' => $other->organization_id])
            ->assertForbidden();
    }

    public function test_show_returns_members_and_role(): void
    {
        $owner = User::factory()->create();
        $this->member($owner);

        Sanctum::actingAs($owner);

        $this->getJson('/api/organization')
            ->assertOk()
            ->assertJsonPath('role', 'owner')
            ->assertJsonPath('canManageTeam', true)
            ->assertJsonCount(2, 'members');
    }

    public function test_owner_can_change_a_members_role(): void
    {
        $owner = User::factory()->create();
        $member = $this->member($owner);

        Sanctum::actingAs($owner);

        $this->patchJson("/api/organization/members/{$member->id}", ['role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('member.role', 'admin');

        $this->assertSame('admin', $member->fresh()->role);
    }

    public function test_owner_role_cannot_be_changed(): void
    {
        $owner = User::factory()->create();
        $admin = $this->member($owner, 'admin');

        Sanctum::actingAs($admin);

        $this->patchJson("/api/organization/members/{$owner->id}", ['role' => 'member'])->assertForbidden();
    }

    public function test_member_cannot_change_roles(): void
    {
        $owner = User::factory()->create();
        $member = $this->member($owner);
        $other = $this->member($owner);

        Sanctum::actingAs($member);

        $this->patchJson("/api/organization/members/{$other->id}", ['role' => 'admin'])->assertForbidden();
    }

    public function test_removing_a_member_gives_them_a_fresh_org(): void
    {
        $owner = User::factory()->create();
        $member = $this->member($owner);
        $oldOrg = $member->organization_id;

        Sanctum::actingAs($owner);

        $this->deleteJson("/api/organization/members/{$member->id}")->assertNoContent();

        $member->refresh();
        $this->assertNotSame($oldOrg, $member->organization_id);
        $this->assertSame('owner', $member->role);
    }

    public function test_member_sees_the_whole_fleet(): void
    {
        $owner = User::factory()->create();
        Generator::factory()->count(2)->for($owner)->create();
        $member = $this->member($owner);

        Sanctum::actingAs($member);

        $this->getJson('/api/generators')->assertOk()->assertJsonCount(2, 'generators');
    }

    public function test_members_see_only_their_own_tasks_owner_sees_all(): void
    {
        $owner = User::factory()->create();
        $generator = Generator::factory()->for($owner)->create();
        $member = $this->member($owner);

        // Owner creates one task, member creates another.
        Sanctum::actingAs($owner);
        $this->postJson('/api/tasks', ['title' => "Owner's task", 'generator_id' => $generator->id])->assertCreated();

        Sanctum::actingAs($member);
        $this->postJson('/api/tasks', ['title' => "Member's task", 'generator_id' => $generator->id])->assertCreated();

        // Member sees only their own.
        $this->getJson('/api/tasks')->assertOk()->assertJsonCount(1, 'tasks')->assertJsonPath('counts.all', 1);

        // Owner sees both.
        Sanctum::actingAs($owner);
        $this->getJson('/api/tasks')->assertOk()->assertJsonCount(2, 'tasks')->assertJsonPath('counts.all', 2);
    }
}
