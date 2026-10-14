<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_returns_the_users_notifications_with_unread_count(): void
    {
        $user = User::factory()->create();
        Notification::factory()->for($user)->count(2)->create(['read_at' => null]);
        Notification::factory()->for($user)->create(['read_at' => now()]);
        Notification::factory()->for(User::factory())->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(3, 'notifications')
            ->assertJsonPath('unreadCount', 2);
    }

    public function test_mark_one_as_read(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->for($user)->create(['read_at' => null]);

        Sanctum::actingAs($user);

        $this->patchJson("/api/notifications/{$notification->id}")
            ->assertOk()
            ->assertJsonPath('notification.unread', false);

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_mark_all_as_read(): void
    {
        $user = User::factory()->create();
        Notification::factory()->for($user)->count(3)->create(['read_at' => null]);

        Sanctum::actingAs($user);

        $this->postJson('/api/notifications/read')->assertNoContent();

        $this->assertSame(0, Notification::where('user_id', $user->id)->whereNull('read_at')->count());
    }
}
