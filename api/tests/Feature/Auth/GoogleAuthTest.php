<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Google\Auth\AccessToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private const CLIENT_ID = 'test-web-client.apps.googleusercontent.com';

    protected function fakeVerifier(array $payload): void
    {
        config(['services.google.client_id' => self::CLIENT_ID]);
        config(['services.google.ios_client_id' => null]);

        $mock = Mockery::mock(AccessToken::class);
        $mock->shouldReceive('verify')->andReturn($payload);
        $this->app->instance(AccessToken::class, $mock);
    }

    protected function googlePayload(array $overrides = []): array
    {
        return array_merge([
            'sub' => '113456789012345678901',
            'email' => 'google.user@example.com',
            'name' => 'Google User',
            'picture' => 'https://lh3.googleusercontent.com/a/photo.png',
            'aud' => self::CLIENT_ID,
            'iss' => 'https://accounts.google.com',
        ], $overrides);
    }

    public function test_google_sign_in_creates_a_new_user(): void
    {
        $this->fakeVerifier($this->googlePayload());

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertOk()
            ->assertJsonStructure(['user' => ['id', 'email', 'name', 'photoUrl', 'provider'], 'token'])
            ->assertJsonPath('user.email', 'google.user@example.com')
            ->assertJsonPath('user.provider', 'google')
            ->assertJsonPath('user.photoUrl', 'https://lh3.googleusercontent.com/a/photo.png');

        $this->assertDatabaseHas('users', [
            'email' => 'google.user@example.com',
            'google_id' => '113456789012345678901',
            'provider' => 'google',
        ]);
    }

    public function test_google_sign_in_links_an_existing_email_account(): void
    {
        $user = User::factory()->create([
            'email' => 'google.user@example.com',
            'provider' => 'email',
            'google_id' => null,
        ]);

        $this->fakeVerifier($this->googlePayload());

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertOk()
            ->assertJsonPath('user.id', (string) $user->id);

        $this->assertSame('113456789012345678901', $user->fresh()->google_id);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_google_sign_in_is_idempotent_for_a_returning_user(): void
    {
        $this->fakeVerifier($this->googlePayload());

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])->assertOk();
        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])->assertOk();

        $this->assertDatabaseCount('users', 1);
    }

    public function test_google_sign_in_rejects_a_token_for_a_different_audience(): void
    {
        $this->fakeVerifier($this->googlePayload(['aud' => 'someone-elses-client.apps.googleusercontent.com']));

        $this->postJson('/api/auth/google', ['id_token' => 'valid-token'])
            ->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_google_sign_in_rejects_an_unverifiable_token(): void
    {
        config(['services.google.client_id' => self::CLIENT_ID]);

        $mock = Mockery::mock(AccessToken::class);
        $mock->shouldReceive('verify')->andReturn(false);
        $this->app->instance(AccessToken::class, $mock);

        $this->postJson('/api/auth/google', ['id_token' => 'garbage'])
            ->assertStatus(401);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_google_sign_in_requires_an_id_token(): void
    {
        $this->postJson('/api/auth/google', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('id_token');
    }
}
