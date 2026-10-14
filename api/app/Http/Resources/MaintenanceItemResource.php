<?php

namespace App\Http\Resources;

use App\Models\MaintenanceItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @mixin MaintenanceItem
 */
class MaintenanceItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $done = $this->completed_at !== null;
        $status = $this->deriveStatus($done);
        $assignedToMe = $this->assignee_id !== null && $this->assignee_id === $request->user()?->id;

        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'detail' => $this->detail,
            'done' => $done,
            'status' => $status,
            'statusLabel' => Str::upper($status),
            'dueDate' => $this->due_date?->toDateString(),
            'dateLabel' => $this->dateLabel($done),
            'cost' => $this->cost,
            'costLabel' => $this->cost !== null ? '$'.number_format((float) $this->cost, 0) : null,
            'assigneeName' => $assignedToMe ? 'You' : ($this->assignee?->name ?? 'Unassigned'),
            'assigneeInitials' => $this->assignee?->initials,
            'unassigned' => $this->assignee_id === null,
            'assignedToMe' => $assignedToMe,
        ];
    }

    protected function deriveStatus(bool $done): string
    {
        if ($done) {
            return 'done';
        }
        if ($this->due_date === null) {
            return 'scheduled';
        }

        $today = Carbon::today();
        $due = $this->due_date->copy()->startOfDay();

        if ($due->lt($today)) {
            return 'overdue';
        }
        if ((int) $today->diffInDays($due) <= 7) {
            return 'soon';
        }

        return 'scheduled';
    }

    protected function dateLabel(bool $done): ?string
    {
        if ($done) {
            return $this->completed_at?->format('M j');
        }

        return $this->due_date ? 'Due '.$this->due_date->format('M j') : null;
    }
}
