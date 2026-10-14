<?php

namespace Tests\Feature\Auth;

use App\Models\Generator;
use App\Models\Task;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeleteAccountTest extends TestCase
{
    use RefreshDatabase;

    /** Add a user to an existing owner's org with the given role. */
    private function member(User $owner, string $role = 'member'): User
    {
        $user = User::factory()->create();
        app(Teams::class)->attach($user, $owner->organization, $role);

        return $user->refresh();
    }

    public function test_deleting_an_account_requires_authentication(): void
    {
        $this->deleteJson('/api/user')->assertUnauthorized();
    }

    public function test_a_solo_user_deletes_their_account_org_and_fleet(): void
    {
        $user = User::factory()->create();
        $organizationId = $user->organization_id;
        $generator = Generator::factory()->for($user)->create();
        Task::factory()->for($user)->for($generator)->create();
        $user->createToken('mobile');

        Sanctum::actingAs($user);

        $this->deleteJson('/api/user')->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('organizations', ['id' => $organizationId]);
        $this->assertDatabaseMissing('generators', ['id' => $generator->id]);
        $this->assertDatabaseMissing('tasks', ['user_id' => $user->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);
    }

    public function test_deleting_an_owner_transfers_the_org_and_fleet_to_an_admin(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization;
        $admin = $this->member($owner, 'admin');
        $plainMember = $this->member($owner, 'member');

        // A shared generator the owner created — it must survive under the org.
        $generator = Generator::factory()->for($owner)->create();

        Sanctum::actingAs($owner);
        $this->deleteJson('/api/user')->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $owner->id]);
        // Org survives with the admin promoted to owner.
        $this->assertDatabaseHas('organizations', ['id' => $organization->id, 'owner_id' => $admin->id]);
        $this->assertSame('owner', $admin->fresh()->roleIn($organization));
        $this->assertSame('member', $plainMember->fresh()->roleIn($organization));
        // The shared generator lives on, reassigned to the new owner.
        $this->assertDatabaseHas('generators', [
            'id' => $generator->id,
            'organization_id' => $organization->id,
            'user_id' => $admin->id,
        ]);
    }

    public function test_deleting_an_owner_with_only_members_promotes_the_longest_standing_member(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization;
        $first = $this->member($owner, 'member');
        $this->member($owner, 'member'); // joined later

        Sanctum::actingAs($owner);
        $this->deleteJson('/api/user')->assertNoContent();

        $this->assertDatabaseHas('organizations', ['id' => $organization->id, 'owner_id' => $first->id]);
        $this->assertSame('owner', $first->fresh()->roleIn($organization));
    }

    public function test_deleting_a_plain_member_leaves_the_org_and_reassigns_their_fleet(): void
    {
        $owner = User::factory()->create();
        $organization = $owner->organization;
        $member = $this->member($owner, 'member');

        // A generator the member added to the shared org (their active org is now the owner's).
        $generator = Generator::factory()->for($member)->create();
        $this->assertSame($organization->id, $generator->organization_id);

        Sanctum::actingAs($member);
        $this->deleteJson('/api/user')->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $member->id]);
        // Org untouched, still owned by the original owner.
        $this->assertDatabaseHas('organizations', ['id' => $organization->id, 'owner_id' => $owner->id]);
        // The member's generator survives, reassigned to the owner.
        $this->assertDatabaseHas('generators', [
            'id' => $generator->id,
            'organization_id' => $organization->id,
            'user_id' => $owner->id,
        ]);
        // Their membership pivot is gone.
        $this->assertDatabaseMissing('organization_user', [
            'organization_id' => $organization->id,
            'user_id' => $member->id,
        ]);
    }

    public function test_deleting_an_account_revokes_its_tokens(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('mobile')->plainTextToken;

        $this->withToken($token)->deleteJson('/api/user')->assertNoContent();

        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $user->id]);

        // Drop the cached guard (a singleton across requests in tests) so the
        // next request re-reads the now-deleted token instead of the cached user.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }
}
