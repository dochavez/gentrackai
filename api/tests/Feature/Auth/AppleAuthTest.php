<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\AppleIdentityToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AppleAuthTest extends TestCase
{
    use RefreshDatabase;

    private const BUNDLE_ID = 'com.thotsuya.gentrackai';

    /** @param array<string, mixed>|null $claims */
    protected function fakeVerifier(?array $claims): void
    {
        config(['services.apple.bundle_ids' => [self::BUNDLE_ID]]);

        $mock = Mockery::mock(AppleIdentityToken::class);
        $mock->shouldReceive('verify')->andReturn($claims);
        $this->app->instance(AppleIdentityToken::class, $mock);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    protected function appleClaims(array $overrides = []): array
    {
        return array_merge([
            'sub' => '001234.abcdef0123456789abcdef0123456789.1234',
            'email' => 'apple.user@privaterelay.appleid.com',
            'email_verified' => 'true',
            'is_private_email' => 'true',
            'aud' => self::BUNDLE_ID,
            'iss' => 'https://appleid.apple.com',
        ], $overrides);
    }

    public function test_apple_sign_in_creates_a_new_user(): void
    {
        $this->fakeVerifier($this->appleClaims());

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token', 'name' => 'Apple User'])
            ->assertOk()
            ->assertJsonStructure(['user' => ['id', 'email', 'name', 'provider'], 'token'])
            ->assertJsonPath('user.email', 'apple.user@privaterelay.appleid.com')
            ->assertJsonPath('user.name', 'Apple User')
            ->assertJsonPath('user.provider', 'apple');

        $this->assertDatabaseHas('users', [
            'email' => 'apple.user@privaterelay.appleid.com',
            'apple_id' => '001234.abcdef0123456789abcdef0123456789.1234',
            'provider' => 'apple',
        ]);
    }

    public function test_apple_sign_in_provisions_an_organization(): void
    {
        $this->fakeVerifier($this->appleClaims());

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])->assertOk();

        $user = User::firstOrFail();
        $this->assertNotNull($user->organization);
        $this->assertTrue($user->isOwner());
    }

    public function test_apple_sign_in_falls_back_to_the_email_local_part_when_no_name_is_shared(): void
    {
        $this->fakeVerifier($this->appleClaims(['email' => 'jane.doe@example.com']));

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])
            ->assertOk()
            ->assertJsonPath('user.name', 'jane.doe');
    }

    public function test_apple_sign_in_links_an_existing_email_account(): void
    {
        $user = User::factory()->create([
            'email' => 'apple.user@privaterelay.appleid.com',
            'provider' => 'email',
        ]);

        $this->fakeVerifier($this->appleClaims());

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])
            ->assertOk()
            ->assertJsonPath('user.id', (string) $user->id);

        $this->assertSame('001234.abcdef0123456789abcdef0123456789.1234', $user->fresh()->apple_id);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_apple_sign_in_matches_a_returning_user_by_subject_without_an_email_claim(): void
    {
        $this->fakeVerifier($this->appleClaims());
        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])->assertOk();

        // Apple omits the email claim on later sign-ins; `sub` still matches.
        $claims = $this->appleClaims();
        unset($claims['email']);
        $this->fakeVerifier($claims);

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])->assertOk();

        $this->assertDatabaseCount('users', 1);
    }

    public function test_apple_sign_in_rejects_a_first_time_token_without_an_email(): void
    {
        $claims = $this->appleClaims();
        unset($claims['email']);
        $this->fakeVerifier($claims);

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])
            ->assertStatus(422);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_apple_sign_in_rejects_a_token_for_a_different_audience(): void
    {
        $this->fakeVerifier($this->appleClaims(['aud' => 'com.someone.else']));

        $this->postJson('/api/auth/apple', ['identity_token' => 'valid-token'])
            ->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_apple_sign_in_rejects_an_unverifiable_token(): void
    {
        $this->fakeVerifier(null);

        $this->postJson('/api/auth/apple', ['identity_token' => 'garbage'])
            ->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_apple_sign_in_requires_an_identity_token(): void
    {
        $this->postJson('/api/auth/apple', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('identity_token');
    }

    public function test_apple_sign_in_accepts_the_camel_case_alias(): void
    {
        $this->fakeVerifier($this->appleClaims());

        $this->postJson('/api/auth/apple', ['identityToken' => 'valid-token'])->assertOk();
    }
}
