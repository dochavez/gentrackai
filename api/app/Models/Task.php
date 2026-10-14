<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    /** Denormalize the org from the owning user's active org so scoping stays simple. */
    protected static function booted(): void
    {
        static::creating(function (Task $task): void {
            if (empty($task->organization_id) && $task->user_id) {
                $task->organization_id = User::whereKey($task->user_id)->value('current_organization_id');
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'generator_id',
        'assignee_id',
        'title',
        'due_date',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * @return BelongsTo<Generator, $this>
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(Generator::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
