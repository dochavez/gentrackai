<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\User;
use App\Notifications\OrganizationInvitationNotification;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvitationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_invite_with_a_generic_response(): void
    {
        Notification::fake();
        $owner = User::factory()->create();

        Sanctum::actingAs($owner);

        $this->postJson('/api/organization/invitations', ['email' => 'new@example.com', 'role' => 'member'])
            ->assertStatus(202)
            ->assertJsonPath('message', 'Invitation sent to new@example.com.');

        $this->assertDatabaseHas('invitations', [
            'organization_id' => $owner->organization_id,
            'email' => 'new@example.com',
            'role' => 'member',
        ]);
        Notification::assertSentOnDemand(OrganizationInvitationNotification::class);
    }

    public function test_invite_response_does_not_reveal_whether_the_email_exists(): void
    {
        Notification::fake();
        $owner = User::factory()->create();
        $existing = User::factory()->create(); // a real account in another org

        Sanctum::actingAs($owner);

        $existingResponse = $this->postJson('/api/organization/invitations', ['email' => $existing->email, 'role' => 'member']);
        $unknownResponse = $this->postJson('/api/organization/invitations', ['email' => 'nobody@example.com', 'role' => 'member']);

        $existingResponse->assertStatus(202);
        $unknownResponse->assertStatus(202);
        // Same shape/status either way — no enumeration.
        $this->assertSame(
            "Invitation sent to {$existing->email}.",
            $existingResponse->json('message')
        );
        $this->assertSame('Invitation sent to nobody@example.com.', $unknownResponse->json('message'));
    }

    public function test_member_cannot_invite(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        app(Teams::class)->attach($member, $owner->organization, 'member');

        Sanctum::actingAs($member);

        $this->postJson('/api/organization/invitations', ['email' => 'x@example.com', 'role' => 'member'])
            ->assertForbidden();
    }

    public function test_invitee_sees_and_accepts_a_pending_invitation(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create(); // has their own org for now
        $invitation = Invitation::create([
            'organization_id' => $owner->organization_id,
            'email' => strtolower($invitee->email),
            'role' => 'member',
            'token' => 'tok-'.uniqid(),
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(14),
        ]);

        Sanctum::actingAs($invitee);

        $this->getJson('/api/invitations')->assertOk()->assertJsonCount(1, 'invitations');

        $this->patchJson("/api/invitations/{$invitation->id}")->assertOk();

        $invitee->refresh();
        $this->assertSame($owner->organization_id, $invitee->organization_id);
        $this->assertSame('member', $invitee->role);
        $this->assertNotNull($invitation->fresh()->accepted_at);
    }

    public function test_cannot_accept_an_invitation_for_a_different_email(): void
    {
        $owner = User::factory()->create();
        $invitation = Invitation::create([
            'organization_id' => $owner->organization_id,
            'email' => 'someone-else@example.com',
            'role' => 'member',
            'token' => 'tok-'.uniqid(),
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(14),
        ]);

        Sanctum::actingAs(User::factory()->create());

        $this->patchJson("/api/invitations/{$invitation->id}")->assertForbidden();
    }

    public function test_invitee_can_decline(): void
    {
        $owner = User::factory()->create();
        $invitee = User::factory()->create();
        $invitation = Invitation::create([
            'organization_id' => $owner->organization_id,
            'email' => strtolower($invitee->email),
            'role' => 'member',
            'token' => 'tok-'.uniqid(),
            'invited_by' => $owner->id,
            'expires_at' => now()->addDays(14),
        ]);

        Sanctum::actingAs($invitee);

        $this->deleteJson("/api/invitations/{$invitation->id}")->assertNoContent();
        $this->assertDatabaseMissing('invitations', ['id' => $invitation->id]);
    }
}
