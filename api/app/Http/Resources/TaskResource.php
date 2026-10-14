<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * @mixin \App\Models\Task
 */
class TaskResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $done = $this->completed_at !== null;
        [$dueLabel, $dueTone] = $this->due($done);
        $isMine = $this->assignee_id !== null && $this->assignee_id === $request->user()?->id;

        return [
            'id' => (string) $this->id,
            'title' => $this->title,
            'generatorId' => (string) $this->generator_id,
            'generatorName' => $this->generator?->name,
            'done' => $done,
            'dueDate' => $this->due_date?->toDateString(),
            'dueLabel' => $dueLabel,
            'dueTone' => $dueTone,
            'assigneeName' => $isMine ? 'You' : ($this->assignee?->name ?? 'Unassigned'),
            'assigneeInitials' => $this->assignee?->initials,
            'unassigned' => $this->assignee_id === null,
            'assignedToMe' => $isMine,
        ];
    }

    /**
     * @return array{0: string, 1: string} [label, tone]
     */
    protected function due(bool $done): array
    {
        if ($done) {
            return ['DONE', 'done'];
        }
        if ($this->due_date === null) {
            return ['NO DUE DATE', 'neutral'];
        }

        $today = Carbon::today();
        $due = $this->due_date->copy()->startOfDay();

        if ($due->lt($today)) {
            return ['OVERDUE', 'overdue'];
        }
        if ($due->isSameDay($today)) {
            return ['TODAY', 'soon'];
        }

        $days = (int) $today->diffInDays($due);

        if ($days <= 2) {
            return ['IN '.$days.' '.($days === 1 ? 'DAY' : 'DAYS'), 'soon'];
        }
        if ($days < 14) {
            return ['IN '.$days.' DAYS', 'neutral'];
        }

        return ['IN '.intdiv($days, 7).' WK', 'neutral'];
    }
}
