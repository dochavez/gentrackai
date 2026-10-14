<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\MaintenanceRequest;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TechnicianPanelTest extends TestCase
{
    use RefreshDatabase;

    private function customer(string $state = 'CA'): User
    {
        $user = User::factory()->create();
        $user->update([
            'address_line1' => '1 Main St',
            'city' => 'Town',
            'state' => $state,
            'postal_code' => '90001',
            'country' => 'US',
        ]);

        return $user;
    }

    private function provider(bool $paymentReady = true): User
    {
        $user = User::factory()->create();
        $user->organization->providerProfile()->create([
            'business_name' => 'Fix-It',
            'payment_ready' => $paymentReady,
            'onboarded_at' => now(),
        ]);
        $user->organization->serviceAreas()->create(['state' => 'CA']);

        return $user;
    }

    private function openRequest(string $state = 'CA'): MaintenanceRequest
    {
        $customer = $this->customer($state);
        $generator = Generator::factory()->for($customer)->create();
        Sanctum::actingAs($customer);
        $id = $this->postJson('/api/maintenance-requests', ['generator_id' => $generator->id, 'detail' => 'x'])
            ->assertCreated()->json('request.id');

        return MaintenanceRequest::findOrFail($id);
    }

    public function test_register_captures_the_service_address(): void
    {
        $this->postJson('/api/register', [
            'name' => 'Dana Tech',
            'email' => 'dana@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'address_line1' => '9 Grid Rd',
            'city' => 'Reno',
            'state' => 'nv', // normalized to NV
            'postal_code' => '89501',
        ])
            ->assertCreated()
            ->assertJsonPath('user.state', 'NV')
            ->assertJsonPath('user.hasAddress', true);

        $this->assertDatabaseHas('users', ['email' => 'dana@example.com', 'state' => 'NV', 'country' => 'US']);
    }

    public function test_profile_update_sets_address_and_flips_has_address(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/user')->assertJsonPath('user.hasAddress', false);

        $this->patchJson('/api/user/profile', [
            'address_line1' => '500 Elm St',
            'city' => 'Springfield',
            'state' => 'ca', // normalized to CA
            'postal_code' => '90210',
        ])
            ->assertOk()
            ->assertJsonPath('user.hasAddress', true)
            ->assertJsonPath('user.state', 'CA');
    }

    public function test_profile_rejects_an_invalid_state(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->patchJson('/api/user/profile', ['state' => 'ZZ'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('state');
    }

    public function test_onboarding_turns_the_org_into_a_provider(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/technician/onboarding', [
            'business_name' => 'Bolt Generators',
            'service_states' => ['ca', 'nv'],
        ])
            ->assertCreated()
            ->assertJsonPath('user.isTechnician', true);

        $this->assertDatabaseHas('provider_profiles', [
            'organization_id' => $user->organization_id,
            'business_name' => 'Bolt Generators',
        ]);
        $this->assertDatabaseHas('provider_service_areas', ['provider_organization_id' => $user->organization_id, 'state' => 'CA']);
        $this->assertDatabaseHas('provider_service_areas', ['provider_organization_id' => $user->organization_id, 'state' => 'NV']);

        $this->getJson('/api/technician')->assertOk()->assertJsonPath('technician.isProvider', true);
    }

    public function test_onboarding_requires_owner_or_admin(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        app(Teams::class)->attach($member, $owner->organization, 'member');
        // Act as the member scoped INTO the owner's org (where they're not a manager).
        $member->forceFill(['current_organization_id' => $owner->organization_id])->save();

        Sanctum::actingAs($member);
        $this->postJson('/api/technician/onboarding', [
            'business_name' => 'Nope',
            'service_states' => ['CA'],
        ])->assertForbidden();
    }

    public function test_owner_updates_the_technician_profile(): void
    {
        $provider = $this->provider(); // serves CA, business "Fix-It"
        Sanctum::actingAs($provider);

        $this->patchJson('/api/technician/profile', [
            'business_name' => 'Bolt Generators',
            'bio' => 'ASE certified, 10 years.',
            'phone' => '5551234567',
            'service_states' => ['ca', 'nv'],
        ])
            ->assertOk()
            ->assertJsonPath('technician.businessName', 'Bolt Generators')
            ->assertJsonPath('technician.bio', 'ASE certified, 10 years.');

        $this->assertDatabaseHas('provider_profiles', [
            'organization_id' => $provider->organization_id,
            'business_name' => 'Bolt Generators',
        ]);
        $this->assertDatabaseHas('provider_service_areas', [
            'provider_organization_id' => $provider->organization_id,
            'state' => 'NV',
        ]);
    }

    public function test_offer_is_gated_without_a_payment_method_when_a_card_is_required(): void
    {
        config(['plans.technician.require_payment_method' => true]);

        $provider = $this->provider(paymentReady: false);
        $request = $this->openRequest('CA');

        Sanctum::actingAs($provider);
        $this->postJson("/api/technician/requests/{$request->id}/offers", ['price' => 150])
            ->assertStatus(402)
            ->assertJsonPath('feature', 'technician')
            ->assertJsonPath('upgradeRequired', true);
    }

    public function test_the_trial_needs_no_card_by_default(): void
    {
        // iOS sells the technician plan as an In-App Purchase, so there is no
        // Stripe card to capture — the up-front requirement is off by default.
        $provider = $this->provider(paymentReady: false);
        $request = $this->openRequest('CA');

        Sanctum::actingAs($provider);
        $this->postJson("/api/technician/requests/{$request->id}/offers", ['price' => 150])
            ->assertCreated();
    }

    public function test_a_store_subscription_counts_as_billing_being_ready(): void
    {
        config(['plans.technician.require_payment_method' => true]);

        $provider = $this->provider(paymentReady: false);
        $provider->organization->storeSubscriptions()->create([
            'type' => 'technician',
            'store' => 'app_store',
            'entitlement_id' => 'technician_pro',
            'product_id' => 'gentrack_tech_monthly',
            'expires_at' => now()->addMonth(),
        ]);
        $request = $this->openRequest('CA');

        Sanctum::actingAs($provider);
        $this->postJson("/api/technician/requests/{$request->id}/offers", ['price' => 150])
            ->assertCreated();
    }

    public function test_free_trial_covers_one_job_then_gates_the_next_offer(): void
    {
        $provider = $this->provider(); // payment ready, no subscription, trial = 1 job

        // Win and hold one job → the trial slot is occupied.
        $request1 = $this->openRequest('CA');
        Sanctum::actingAs($provider);
        $offer1 = $this->postJson("/api/technician/requests/{$request1->id}/offers", ['price' => 200])
            ->assertCreated()->json('offer.id');
        Sanctum::actingAs($request1->fresh()->creator);
        $this->postJson("/api/maintenance-requests/{$request1->id}/offers/{$offer1}/accept")->assertOk();

        // A second request → offering is now gated (trial used, no subscription).
        $request2 = $this->openRequest('CA');
        Sanctum::actingAs($provider);
        $this->postJson("/api/technician/requests/{$request2->id}/offers", ['price' => 220])
            ->assertStatus(402)
            ->assertJsonPath('feature', 'technician');

        $this->getJson('/api/technician')
            ->assertOk()
            ->assertJsonPath('technician.panelUnlocked', false)
            ->assertJsonPath('technician.trial.remaining', 0);
    }

    public function test_a_job_won_during_the_trial_can_still_be_completed(): void
    {
        $provider = $this->provider();
        $request = $this->openRequest('CA');

        Sanctum::actingAs($provider);
        $offer = $this->postJson("/api/technician/requests/{$request->id}/offers", ['price' => 180])
            ->assertCreated()->json('offer.id');
        Sanctum::actingAs($request->fresh()->creator);
        $this->postJson("/api/maintenance-requests/{$request->id}/offers/{$offer}/accept")->assertOk();

        // Even though the trial is now "used up", the in-flight job proceeds.
        Sanctum::actingAs($provider);
        $this->patchJson("/api/technician/jobs/{$request->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])
            ->assertOk();
        $this->patchJson("/api/technician/jobs/{$request->id}/complete")
            ->assertOk()
            ->assertJsonPath('job.status', 'completed');
    }
}
