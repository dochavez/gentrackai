<?php

namespace App\Notifications;

use App\Models\MaintenanceItem;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaintenanceDueNotification extends Notification
{
    use Queueable;

    public function __construct(private MaintenanceItem $item) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $generator = $this->item->generator?->name ?? 'your generator';
        $due = $this->item->due_date?->format('M j, Y');
        $greetingName = $notifiable->first_name ?? null;

        return (new MailMessage)
            ->subject('Maintenance due: '.$this->item->title)
            ->greeting('Hello'.($greetingName ? ' '.$greetingName : '').'!')
            ->line("A maintenance service is due for {$generator}.")
            ->line($this->item->title.($due ? " — due {$due}." : '.'))
            ->line('Open the GenTrack app to review the details and mark it complete once the work is done.');
    }
}
