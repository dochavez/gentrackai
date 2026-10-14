<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * In-App Purchase entitlements (App Store / Play Store via RevenueCat), which
 * unlock Pro alongside — and independently of — Stripe.
 */
class StoreSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    private const WEBHOOK_SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.revenuecat.secret_key' => 'sk_test',
            'services.revenuecat.webhook_secret' => self::WEBHOOK_SECRET,
            'plans.iap.entitlements' => ['default' => 'pro', 'technician' => 'technician_pro'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function webhookEvent(Organization $organization, array $overrides = []): array
    {
        return ['event' => array_merge([
            'id' => 'evt_'.fake()->uuid(),
            'type' => 'INITIAL_PURCHASE',
            'app_user_id' => 'org_'.$organization->id,
            'product_id' => 'gentrack_pro_monthly',
            'entitlement_ids' => ['pro'],
            'expiration_at_ms' => now()->addMonth()->getTimestampMs(),
            'store' => 'APP_STORE',
            'environment' => 'PRODUCTION',
        ], $overrides)];
    }

    /** @param array<string, mixed> $payload */
    private function postWebhook(array $payload): TestResponse
    {
        return $this->postJson('/api/webhooks/revenuecat', $payload, [
            'Authorization' => self::WEBHOOK_SECRET,
        ]);
    }

    public function test_an_active_store_entitlement_unlocks_pro(): void
    {
        $user = User::factory()->create();
        $user->organization->storeSubscriptions()->create([
            'type' => 'default',
            'store' => 'app_store',
            'entitlement_id' => 'pro',
            'expires_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/billing')
            ->assertOk()
            ->assertJsonPath('plan', 'pro')
            ->assertJsonPath('subscribed', true)
            ->assertJsonPath('source', 'app_store')
            ->assertJsonPath('limits.generators', null); // unlimited
    }

    public function test_an_expired_store_entitlement_does_not_unlock_pro(): void
    {
        $user = User::factory()->create();
        $user->organization->storeSubscriptions()->create([
            'type' => 'default',
            'store' => 'app_store',
            'entitlement_id' => 'pro',
            'expires_at' => now()->subDay(),
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/billing')
            ->assertOk()
            ->assertJsonPath('plan', 'free')
            ->assertJsonPath('subscribed', false)
            ->assertJsonPath('source', null);
    }

    public function test_stripe_checkout_is_refused_while_the_store_is_billing(): void
    {
        config(['plans.prices.pro_monthly' => 'price_test']);

        $user = User::factory()->create();
        $user->organization->storeSubscriptions()->create([
            'type' => 'default',
            'store' => 'app_store',
            'entitlement_id' => 'pro',
            'expires_at' => now()->addMonth(),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/billing/checkout', ['interval' => 'monthly'])
            ->assertStatus(409);
    }

    public function test_the_sync_endpoint_applies_entitlements_from_revenuecat(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;

        Http::fake([
            'api.revenuecat.com/v1/subscribers/org_'.$organization->id => Http::response([
                'subscriber' => [
                    'entitlements' => [
                        'pro' => [
                            'expires_date' => now()->addMonth()->toIso8601String(),
                            'product_identifier' => 'gentrack_pro_yearly',
                            'store' => 'APP_STORE',
                        ],
                    ],
                ],
            ]),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/billing/iap/sync')
            ->assertOk()
            ->assertJsonPath('synced', true)
            ->assertJsonPath('plan', 'pro');

        $this->assertDatabaseHas('store_subscriptions', [
            'organization_id' => $organization->id,
            'type' => 'default',
            'product_id' => 'gentrack_pro_yearly',
            'store' => 'app_store',
        ]);
    }

    public function test_the_sync_endpoint_drops_an_entitlement_the_store_no_longer_reports(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;
        $organization->storeSubscriptions()->create([
            'type' => 'default',
            'store' => 'app_store',
            'entitlement_id' => 'pro',
            'expires_at' => now()->addMonth(),
        ]);

        Http::fake([
            'api.revenuecat.com/*' => Http::response(['subscriber' => ['entitlements' => []]]),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/billing/iap/sync')->assertOk()->assertJsonPath('plan', 'free');

        $this->assertDatabaseCount('store_subscriptions', 0);
    }

    public function test_the_sync_endpoint_leaves_state_alone_when_revenuecat_is_unreachable(): void
    {
        $user = User::factory()->create();

        Http::fake(['api.revenuecat.com/*' => Http::response(status: 503)]);

        Sanctum::actingAs($user);

        $this->postJson('/api/billing/iap/sync')
            ->assertStatus(202)
            ->assertJsonPath('synced', false);
    }

    public function test_an_expired_entitlement_from_revenuecat_is_ignored(): void
    {
        $user = User::factory()->create();

        Http::fake([
            'api.revenuecat.com/*' => Http::response([
                'subscriber' => [
                    'entitlements' => [
                        'pro' => [
                            'expires_date' => now()->subDay()->toIso8601String(),
                            'product_identifier' => 'gentrack_pro_monthly',
                        ],
                    ],
                ],
            ]),
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/billing/iap/sync')->assertOk()->assertJsonPath('plan', 'free');
        $this->assertDatabaseCount('store_subscriptions', 0);
    }

    public function test_the_webhook_grants_pro_on_an_initial_purchase(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;

        $this->postWebhook($this->webhookEvent($organization))
            ->assertOk()
            ->assertJsonPath('handled', 'INITIAL_PURCHASE');

        $this->assertTrue($organization->fresh()->onPro());
        $this->assertDatabaseHas('store_subscriptions', [
            'organization_id' => $organization->id,
            'type' => 'default',
            'entitlement_id' => 'pro',
            'environment' => 'production',
        ]);
    }

    public function test_the_webhook_maps_the_technician_entitlement_to_its_own_subscription(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;

        $this->postWebhook($this->webhookEvent($organization, [
            'entitlement_ids' => ['technician_pro'],
            'product_id' => 'gentrack_tech_monthly',
        ]))->assertOk();

        $organization = $organization->fresh();
        $this->assertTrue($organization->onTechnicianPlan());
        $this->assertFalse($organization->onPro());
    }

    public function test_the_webhook_revokes_pro_on_expiration(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;

        $this->postWebhook($this->webhookEvent($organization))->assertOk();
        $this->assertTrue($organization->fresh()->onPro());

        $this->postWebhook($this->webhookEvent($organization, [
            'type' => 'EXPIRATION',
            'expiration_at_ms' => now()->subHour()->getTimestampMs(),
        ]))->assertOk();

        $this->assertFalse($organization->fresh()->onPro());
    }

    public function test_a_cancellation_keeps_access_until_the_period_ends(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;

        $this->postWebhook($this->webhookEvent($organization, [
            'type' => 'CANCELLATION',
            'expiration_at_ms' => now()->addWeek()->getTimestampMs(),
        ]))->assertOk();

        $this->assertTrue($organization->fresh()->onPro());
        $this->assertNotNull($organization->storeSubscriptions()->first()->canceled_at);
    }

    public function test_a_renewal_clears_a_previous_cancellation(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;

        $this->postWebhook($this->webhookEvent($organization, [
            'type' => 'CANCELLATION',
            'expiration_at_ms' => now()->addWeek()->getTimestampMs(),
        ]))->assertOk();

        $this->postWebhook($this->webhookEvent($organization, [
            'type' => 'RENEWAL',
            'expiration_at_ms' => now()->addMonth()->getTimestampMs(),
        ]))->assertOk();

        $this->assertNull($organization->storeSubscriptions()->first()->canceled_at);
    }

    public function test_the_webhook_is_idempotent_on_redelivery(): void
    {
        $user = User::factory()->create();
        $organization = $user->organization;
        $payload = $this->webhookEvent($organization);

        $this->postWebhook($payload)->assertOk();
        $this->postWebhook($payload)->assertOk();

        $this->assertDatabaseCount('store_subscriptions', 1);
    }

    public function test_the_webhook_ignores_entitlements_it_does_not_grant(): void
    {
        $user = User::factory()->create();

        $this->postWebhook($this->webhookEvent($user->organization, [
            'entitlement_ids' => ['some_other_entitlement'],
        ]))->assertOk();

        $this->assertDatabaseCount('store_subscriptions', 0);
    }

    public function test_the_webhook_ignores_an_unknown_subscriber(): void
    {
        $user = User::factory()->create();
        $payload = $this->webhookEvent($user->organization);
        $payload['event']['app_user_id'] = 'org_999999';

        $this->postWebhook($payload)
            ->assertOk()
            ->assertJsonPath('ignored', 'unknown_subscriber');

        $this->assertDatabaseCount('store_subscriptions', 0);
    }

    public function test_the_webhook_ignores_test_events(): void
    {
        $user = User::factory()->create();

        $this->postWebhook($this->webhookEvent($user->organization, ['type' => 'TEST']))
            ->assertOk()
            ->assertJsonPath('ignored', 'TEST');

        $this->assertDatabaseCount('store_subscriptions', 0);
    }

    public function test_the_webhook_rejects_a_wrong_secret(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/webhooks/revenuecat', $this->webhookEvent($user->organization), [
            'Authorization' => 'not-the-secret',
        ])->assertStatus(401);

        $this->assertDatabaseCount('store_subscriptions', 0);
    }

    public function test_the_webhook_rejects_calls_when_no_secret_is_configured(): void
    {
        config(['services.revenuecat.webhook_secret' => null]);

        $user = User::factory()->create();

        $this->postJson('/api/webhooks/revenuecat', $this->webhookEvent($user->organization))
            ->assertStatus(401);
    }

    public function test_the_sync_endpoint_requires_authentication(): void
    {
        $this->postJson('/api/billing/iap/sync')->assertStatus(401);
    }

    public function test_the_user_payload_carries_the_store_app_user_id(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.iapAppUserId', 'org_'.$user->organization->id);
    }

    /**
     * The id the app identifies with must be the id the webhook can resolve back
     * to an organization -- if these ever drift, purchases succeed in the store
     * and silently never unlock Pro.
     */
    public function test_the_app_user_id_the_app_receives_is_the_one_the_webhook_resolves(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $appUserId = $this->getJson('/api/user')->json('user.iapAppUserId');

        $this->postWebhook($this->webhookEvent($user->organization, ['app_user_id' => $appUserId]))
            ->assertOk();

        $this->assertTrue($user->organization->fresh()->onPro());
    }
}
