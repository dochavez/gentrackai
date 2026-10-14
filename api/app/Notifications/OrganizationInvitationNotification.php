<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(private Invitation $invitation) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $org = $this->invitation->organization?->name ?? 'a team';
        $inviter = $this->invitation->inviter?->name;

        return (new MailMessage)
            ->subject("You've been invited to join {$org} on GenTrack")
            ->greeting('Hello!')
            ->line(($inviter ? "{$inviter} has invited you" : 'You have been invited').
                " to join {$org} on GenTrack AI.")
            ->line("Open the GenTrack app and sign in with {$this->invitation->email} to accept — ".
                "you'll find the invitation waiting on your home screen.")
            ->line("If you don't have an account yet, sign up with this email and you'll join the team automatically.");
    }
}
