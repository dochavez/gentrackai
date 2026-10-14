<?php

namespace App\Console\Commands;

use App\Models\MaintenanceItem;
use App\Models\Notification;
use App\Notifications\MaintenanceDueNotification;
use Illuminate\Console\Command;

class SendMaintenanceReminders extends Command
{
    /**
     * @var string
     */
    protected $signature = 'maintenance:send-reminders';

    /**
     * @var string
     */
    protected $description = 'Notify assignees (in-app + email) of maintenance that is due, once per item.';

    public function handle(): int
    {
        // Remind on/after the due date by default; a lead time can nudge earlier.
        $cutoff = today()->addDays((int) config('maintenance.reminder_lead_days', 0));
        $sent = 0;

        MaintenanceItem::query()
            ->whereNull('completed_at')
            ->whereNull('reminded_at')
            ->whereNotNull('assignee_id')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', $cutoff)
            ->whereHas('generator') // skip services whose generator was removed
            ->with(['assignee', 'generator'])
            ->chunkById(100, function ($items) use (&$sent): void {
                foreach ($items as $item) {
                    $assignee = $item->assignee;
                    if ($assignee === null) {
                        continue;
                    }

                    Notification::create([
                        'user_id' => $assignee->id,
                        'type' => 'maintenance',
                        'icon' => '🔧',
                        'title' => 'Maintenance due',
                        'body' => $item->title.' · '.($item->generator?->name ?? 'a generator'),
                    ]);

                    $assignee->notify(new MaintenanceDueNotification($item));

                    $item->reminded_at = now();
                    $item->save();
                    $sent++;
                }
            });

        $this->info("Sent {$sent} maintenance reminder(s).");

        return self::SUCCESS;
    }
}
