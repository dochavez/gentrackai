<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_an_unverified_user_and_sends_the_link(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'new@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated()->assertJsonPath('user.emailVerified', false);

        $user = User::firstWhere('email', 'new@example.com');
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_resend_sends_another_verification_link(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/email/verification-notification')->assertOk();
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_resend_is_a_noop_when_already_verified(): void
    {
        Notification::fake();
        $user = User::factory()->create(); // verified by default
        Sanctum::actingAs($user);

        $this->postJson('/api/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'Your email is already verified.');
        Notification::assertNothingSent();
    }

    public function test_signed_verify_link_marks_the_email_verified(): void
    {
        $user = User::factory()->unverified()->create();

        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $this->get($url)->assertOk();
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    public function test_tampered_verify_link_does_not_verify(): void
    {
        $user = User::factory()->unverified()->create();

        // Valid signature, wrong hash → not verified.
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->id,
            'hash' => sha1('someone-else@example.com'),
        ]);

        $this->get($url)->assertOk();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }
}
