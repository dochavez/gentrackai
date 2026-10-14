<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\AppleIdentityToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

/**
 * App Store guideline 5.1.1(v): an app offering Sign in with Apple must revoke
 * the user's Apple grant when they delete their account. That means capturing
 * the authorization code at sign-in and calling Apple's revoke endpoint at
 * deletion — and never letting either step break the flow it sits in.
 */
class AppleTokenRevocationTest extends TestCase
{
    use RefreshDatabase;

    private const BUNDLE_ID = 'com.thotsuya.gentrackai';

    private const SUBJECT = '001234.abcdef0123456789abcdef0123456789.1234';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.apple.bundle_ids' => [self::BUNDLE_ID],
            'services.apple.client_id' => self::BUNDLE_ID,
            'services.apple.team_id' => 'ABCDE12345',
            'services.apple.key_id' => 'KEY1234567',
            'services.apple.private_key' => $this->signingKey(),
        ]);

        $mock = Mockery::mock(AppleIdentityToken::class);
        $mock->shouldReceive('verify')->andReturn([
            'sub' => self::SUBJECT,
            'email' => 'apple.user@privaterelay.appleid.com',
            'aud' => self::BUNDLE_ID,
            'iss' => 'https://appleid.apple.com',
        ]);
        $this->app->instance(AppleIdentityToken::class, $mock);
    }

    /** A throwaway P-256 key, so the client secret is really signed in tests. */
    private function signingKey(): string
    {
        $key = openssl_pkey_new([
            'private_key_type' => OPENSSL_KEYTYPE_EC,
            'curve_name' => 'prime256v1',
        ]);

        openssl_pkey_export($key, $pem);

        return $pem;
    }

    public function test_sign_in_stores_the_refresh_token_from_the_authorization_code(): void
    {
        Http::fake([
            'appleid.apple.com/auth/token' => Http::response(['refresh_token' => 'apple-refresh-token']),
        ]);

        $this->postJson('/api/auth/apple', [
            'identity_token' => 'valid-token',
            'authorization_code' => 'one-time-code',
        ])->assertOk();

        $this->assertSame('apple-refresh-token', User::firstOrFail()->apple_refresh_token);

        Http::assertSent(fn ($request) => $request->url() === 'https://appleid.apple.com/auth/token'
            && $request['grant_type'] === 'authorization_code'
            && $request['code'] === 'one-time-code'
            && $request['client_id'] === self::BUNDLE_ID
            && is_string($request['client_secret']) && $request['client_secret'] !== '');
    }

    public function test_the_refresh_token_is_encrypted_at_rest_and_never_serialized(): void
    {
        Http::fake([
            'appleid.apple.com/auth/token' => Http::response(['refresh_token' => 'apple-refresh-token']),
        ]);

        $this->postJson('/api/auth/apple', [
            'identity_token' => 'valid-token',
            'authorization_code' => 'one-time-code',
        ])->assertOk()->assertJsonMissingPath('user.apple_refresh_token');

        $stored = (string) DB::table('users')->value('apple_refresh_token');

        $this->assertNotSame('apple-refresh-token', $stored);
        $this->assertNotEmpty($stored);
    }

    public function test_sign_in_still_succeeds_when_apple_rejects_the_authorization_code(): void
    {
        Http::fake([
            'appleid.apple.com/auth/token' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        $this->postJson('/api/auth/apple', [
            'identity_token' => 'valid-token',
            'authorization_code' => 'stale-code',
        ])->assertOk();

        $this->assertNull(User::firstOrFail()->apple_refresh_token);
    }

    public function test_sign_in_skips_the_exchange_when_no_authorization_code_is_sent(): void
    {
        Http::fake();

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])->assertOk();

        Http::assertNothingSent();
    }

    public function test_sign_in_skips_the_exchange_when_server_credentials_are_missing(): void
    {
        config(['services.apple.private_key' => null]);
        Http::fake();

        $this->postJson('/api/auth/apple', [
            'identity_token' => 'valid-token',
            'authorization_code' => 'one-time-code',
        ])->assertOk();

        Http::assertNothingSent();
    }

    public function test_deleting_the_account_revokes_the_apple_grant(): void
    {
        Http::fake([
            'appleid.apple.com/auth/revoke' => Http::response('', 200),
        ]);

        $user = User::factory()->create(['apple_id' => self::SUBJECT, 'provider' => 'apple']);
        $user->forceFill(['apple_refresh_token' => 'apple-refresh-token'])->save();

        Sanctum::actingAs($user);
        $this->deleteJson('/api/user')->assertNoContent();

        Http::assertSent(fn ($request) => $request->url() === 'https://appleid.apple.com/auth/revoke'
            && $request['token'] === 'apple-refresh-token'
            && $request['token_type_hint'] === 'refresh_token'
            && $request['client_id'] === self::BUNDLE_ID);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_the_account_is_deleted_even_when_apple_refuses_the_revocation(): void
    {
        Http::fake([
            'appleid.apple.com/auth/revoke' => Http::response(['error' => 'invalid_client'], 400),
        ]);

        $user = User::factory()->create(['apple_id' => self::SUBJECT, 'provider' => 'apple']);
        $user->forceFill(['apple_refresh_token' => 'apple-refresh-token'])->save();

        Sanctum::actingAs($user);
        $this->deleteJson('/api/user')->assertNoContent();

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_deleting_a_non_apple_account_does_not_call_apple(): void
    {
        Http::fake();

        $user = User::factory()->create(['provider' => 'email']);

        Sanctum::actingAs($user);
        $this->deleteJson('/api/user')->assertNoContent();

        Http::assertNothingSent();
    }
}
