<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\MaintenanceRequest;
use App\Models\Organization;
use App\Models\User;
use App\Services\Teams;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceMarketplaceTest extends TestCase
{
    use RefreshDatabase;

    /** A customer with a complete service address in the given state. */
    private function customer(string $state = 'CA'): User
    {
        $user = User::factory()->create();
        $user->update([
            'address_line1' => '1 Main St',
            'city' => 'Townsville',
            'state' => $state,
            'postal_code' => '90001',
            'country' => 'US',
        ]);

        return $user;
    }

    /** A solo technician provider serving the given states (payment on file). */
    private function provider(array $states = ['CA'], bool $paymentReady = true): User
    {
        $user = User::factory()->create();
        $org = $user->organization;
        $org->providerProfile()->create([
            'business_name' => 'Fix-It Generators',
            'payment_ready' => $paymentReady,
            'onboarded_at' => now(),
        ]);
        foreach ($states as $state) {
            $org->serviceAreas()->create(['state' => $state]);
        }

        return $user;
    }

    private function createRequest(User $customer, Generator $generator, string $detail = 'Wont start'): MaintenanceRequest
    {
        Sanctum::actingAs($customer);
        $response = $this->postJson('/api/maintenance-requests', [
            'generator_id' => $generator->id,
            'detail' => $detail,
        ])->assertCreated();

        return MaintenanceRequest::findOrFail($response->json('request.id'));
    }

    private function submitOffer(User $provider, MaintenanceRequest $request, float $price = 250): int
    {
        Sanctum::actingAs($provider);

        return (int) $this->postJson("/api/technician/requests/{$request->id}/offers", [
            'price' => $price,
            'message' => 'Can do it this week.',
        ])->assertCreated()->json('offer.id');
    }

    public function test_full_happy_path_request_offer_accept_schedule_complete_review(): void
    {
        $customer = $this->customer('CA');
        $generator = Generator::factory()->for($customer)->create();
        $provider = $this->provider(['CA']);

        // Customer files a request → matching technician is notified.
        $request = $this->createRequest($customer, $generator);
        $this->assertDatabaseHas('maintenance_requests', ['id' => $request->id, 'status' => 'open', 'state' => 'CA']);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $provider->id, 'title' => 'New maintenance request']);

        // Technician sees it in the feed and offers a price.
        Sanctum::actingAs($provider);
        $this->getJson('/api/technician/requests')->assertOk()->assertJsonCount(1, 'requests');
        $offerId = $this->submitOffer($provider, $request, 250);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $customer->id, 'title' => 'New offer received']);

        // Customer views offers and accepts one → solo provider auto-assigned.
        Sanctum::actingAs($customer);
        $this->getJson("/api/maintenance-requests/{$request->id}")->assertOk()->assertJsonCount(1, 'request.offers');
        $this->postJson("/api/maintenance-requests/{$request->id}/offers/{$offerId}/accept")
            ->assertOk()
            ->assertJsonPath('request.status', 'accepted');

        $request->refresh();
        $this->assertSame($provider->organization_id, $request->provider_organization_id);
        $this->assertSame($provider->id, $request->assigned_technician_id);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $provider->id, 'title' => 'Offer accepted']);

        // Technician schedules, then completes.
        Sanctum::actingAs($provider);
        $this->patchJson("/api/technician/jobs/{$request->id}/schedule", [
            'scheduled_at' => now()->addDay()->toIso8601String(),
        ])->assertOk()->assertJsonPath('job.status', 'scheduled');

        $this->patchJson("/api/technician/jobs/{$request->id}/complete")
            ->assertOk()
            ->assertJsonPath('job.status', 'completed');

        $this->assertSame(1, $provider->organization->providerProfile->fresh()->jobs_completed);
        // The completed job is mirrored into the customer's generator history.
        $this->assertDatabaseHas('maintenance_items', ['generator_id' => $generator->id, 'title' => 'External maintenance']);

        // Customer leaves a review → provider rating updates, technician notified.
        Sanctum::actingAs($customer);
        $this->postJson("/api/maintenance-requests/{$request->id}/review", ['rating' => 5, 'comment' => 'Great work'])
            ->assertOk()
            ->assertJsonPath('request.hasReview', true);

        $this->assertDatabaseHas('maintenance_reviews', ['maintenance_request_id' => $request->id, 'rating' => 5]);
        $this->assertEqualsWithDelta(5.0, (float) $provider->organization->providerProfile->fresh()->rating_avg, 0.01);
        $this->assertDatabaseHas('app_notifications', ['user_id' => $provider->id, 'title' => 'New review']);
    }

    public function test_store_is_blocked_without_a_service_address(): void
    {
        $customer = User::factory()->create(); // no address
        $generator = Generator::factory()->for($customer)->create();

        Sanctum::actingAs($customer);
        $this->postJson('/api/maintenance-requests', [
            'generator_id' => $generator->id,
            'detail' => 'Needs oil',
        ])->assertStatus(422);
    }

    public function test_technician_feed_matches_only_served_states(): void
    {
        $provider = $this->provider(['CA']);

        $californian = $this->customer('CA');
        $this->createRequest($californian, Generator::factory()->for($californian)->create());

        $newYorker = $this->customer('NY');
        $this->createRequest($newYorker, Generator::factory()->for($newYorker)->create());

        Sanctum::actingAs($provider);
        $this->getJson('/api/technician/requests')
            ->assertOk()
            ->assertJsonCount(1, 'requests')
            ->assertJsonPath('requests.0.state', 'CA');
    }

    public function test_provider_cannot_offer_on_its_own_request(): void
    {
        // A user who is both a provider and files a request from the same org.
        $user = $this->provider(['CA']);
        $user->update(['address_line1' => '1 Main St', 'city' => 'Town', 'state' => 'CA', 'postal_code' => '90001']);
        $generator = Generator::factory()->for($user)->create();
        $request = $this->createRequest($user, $generator);

        Sanctum::actingAs($user);
        // Own request never appears in the feed…
        $this->getJson('/api/technician/requests')->assertOk()->assertJsonCount(0, 'requests');
        // …and offering on it is rejected.
        $this->postJson("/api/technician/requests/{$request->id}/offers", ['price' => 100])->assertStatus(422);
    }

    public function test_second_accept_on_the_same_request_conflicts(): void
    {
        $customer = $this->customer('CA');
        $generator = Generator::factory()->for($customer)->create();
        $providerA = $this->provider(['CA']);
        $providerB = $this->provider(['CA']);

        $request = $this->createRequest($customer, $generator);
        $offerA = $this->submitOffer($providerA, $request, 200);
        $offerB = $this->submitOffer($providerB, $request, 300);

        Sanctum::actingAs($customer);
        $this->postJson("/api/maintenance-requests/{$request->id}/offers/{$offerA}/accept")->assertOk();
        // The request is no longer open; accepting B conflicts.
        $this->postJson("/api/maintenance-requests/{$request->id}/offers/{$offerB}/accept")->assertStatus(409);
    }

    public function test_review_requires_a_completed_job_and_is_unique(): void
    {
        $customer = $this->customer('CA');
        $generator = Generator::factory()->for($customer)->create();
        $provider = $this->provider(['CA']);
        $request = $this->createRequest($customer, $generator);
        $offerId = $this->submitOffer($provider, $request);

        Sanctum::actingAs($customer);
        // Reviewing an open request is rejected.
        $this->postJson("/api/maintenance-requests/{$request->id}/review", ['rating' => 5])->assertStatus(409);

        // Drive to completed.
        $this->postJson("/api/maintenance-requests/{$request->id}/offers/{$offerId}/accept")->assertOk();
        Sanctum::actingAs($provider);
        $this->patchJson("/api/technician/jobs/{$request->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])->assertOk();
        $this->patchJson("/api/technician/jobs/{$request->id}/complete")->assertOk();

        Sanctum::actingAs($customer);
        $this->postJson("/api/maintenance-requests/{$request->id}/review", ['rating' => 4])->assertOk();
        // A second review is rejected.
        $this->postJson("/api/maintenance-requests/{$request->id}/review", ['rating' => 3])->assertStatus(409);
    }

    public function test_company_accept_needs_assignment_before_scheduling(): void
    {
        $customer = $this->customer('CA');
        $generator = Generator::factory()->for($customer)->create();

        // Company provider: owner + one member technician.
        $owner = $this->provider(['CA']);
        $member = User::factory()->create();
        app(Teams::class)->attach($member, $owner->organization, 'member');

        $request = $this->createRequest($customer, $generator);
        $offerId = $this->submitOffer($owner, $request, 400);

        Sanctum::actingAs($customer);
        $this->postJson("/api/maintenance-requests/{$request->id}/offers/{$offerId}/accept")->assertOk();

        $request->refresh();
        $this->assertNull($request->assigned_technician_id); // company assigns later

        // Scheduling before assignment is rejected.
        Sanctum::actingAs($owner);
        $this->patchJson("/api/technician/jobs/{$request->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])
            ->assertStatus(409);

        // Owner assigns the member, then scheduling works.
        $this->postJson("/api/technician/jobs/{$request->id}/assign", ['technician_id' => $member->id])
            ->assertOk()
            ->assertJsonPath('job.assignedTechnicianName', $member->name);
        $this->patchJson("/api/technician/jobs/{$request->id}/schedule", ['scheduled_at' => now()->addDay()->toIso8601String()])
            ->assertOk()
            ->assertJsonPath('job.status', 'scheduled');
    }

    public function test_show_forbids_a_request_from_another_org(): void
    {
        $customer = $this->customer('CA');
        $generator = Generator::factory()->for($customer)->create();
        $request = $this->createRequest($customer, $generator);

        Sanctum::actingAs(User::factory()->create());
        $this->getJson("/api/maintenance-requests/{$request->id}")->assertForbidden();
    }
}
