<?php

namespace Tests\Feature;

use App\Models\Generator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Testing\TextResponseFake;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_requires_authentication(): void
    {
        $this->getJson('/api/chat')->assertUnauthorized();
    }

    public function test_store_validates_the_message(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/chat', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('message');
    }

    public function test_store_returns_and_persists_the_assistant_reply(): void
    {
        Prism::fake([
            TextResponseFake::make()->withText('Your Generac Guardian is due for an oil change soon.'),
        ]);

        $user = User::factory()->create();
        Generator::factory()->for($user)->create(['name' => 'Generac Guardian']);

        Sanctum::actingAs($user);

        $this->postJson('/api/chat', ['message' => 'What needs service right now?'])
            ->assertCreated()
            ->assertJsonPath('message.role', 'assistant')
            ->assertJsonPath('message.content', 'Your Generac Guardian is due for an oil change soon.');

        $this->assertDatabaseHas('chat_messages', ['role' => 'user', 'content' => 'What needs service right now?']);
        $this->assertDatabaseHas('chat_messages', [
            'role' => 'assistant',
            'content' => 'Your Generac Guardian is due for an oil change soon.',
        ]);
    }

    public function test_index_returns_the_conversation_history(): void
    {
        $user = User::factory()->create();
        $conversation = $user->chatConversation()->create([]);
        $conversation->messages()->create(['role' => 'user', 'content' => 'Hi']);
        $conversation->messages()->create(['role' => 'assistant', 'content' => 'Hello — ask me anything.']);

        Sanctum::actingAs($user);

        $this->getJson('/api/chat')
            ->assertOk()
            ->assertJsonCount(2, 'messages')
            ->assertJsonPath('messages.0.role', 'user')
            ->assertJsonPath('messages.1.content', 'Hello — ask me anything.');
    }

    public function test_index_is_empty_for_a_new_user(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/chat')->assertOk()->assertJsonCount(0, 'messages');
    }

    public function test_store_accepts_a_photo_with_or_without_a_message(): void
    {
        Storage::fake('public');
        Prism::fake([
            TextResponseFake::make()->withText('That looks like a Generac controller showing a low-battery alert.'),
        ]);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/chat', [
            'image' => UploadedFile::fake()->image('fault.jpg'),
        ])
            ->assertCreated()
            ->assertJsonPath('message.role', 'assistant');

        // The user's turn persisted a stored image and it's exposed as a URL.
        $userMessage = $user->chatConversation->messages()->where('role', 'user')->first();
        $this->assertNotNull($userMessage->image_path);
        Storage::disk('public')->assertExists($userMessage->image_path);
    }

    public function test_store_rejects_a_turn_with_neither_text_nor_image(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/chat', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('message');
    }

    public function test_destroy_clears_the_conversation(): void
    {
        $user = User::factory()->create();
        $conversation = $user->chatConversation()->create([]);
        $conversation->messages()->create(['role' => 'user', 'content' => 'Hi']);
        $conversation->messages()->create(['role' => 'assistant', 'content' => 'Hello.']);

        Sanctum::actingAs($user);

        $this->deleteJson('/api/chat')->assertNoContent();

        $this->assertSame(0, $conversation->messages()->count());
        $this->getJson('/api/chat')->assertOk()->assertJsonCount(0, 'messages');
    }
}
