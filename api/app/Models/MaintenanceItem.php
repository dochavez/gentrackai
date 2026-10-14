<?php

namespace App\Models;

use Database\Factories\MaintenanceItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceItem extends Model
{
    /** @use HasFactory<MaintenanceItemFactory> */
    use HasFactory;

    /** Denormalize the org from the parent generator. */
    protected static function booted(): void
    {
        static::creating(function (MaintenanceItem $item): void {
            if (empty($item->organization_id) && $item->generator_id) {
                $item->organization_id = Generator::withTrashed()
                    ->whereKey($item->generator_id)
                    ->value('organization_id');
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'user_id',
        'assignee_id',
        'title',
        'detail',
        'cost',
        'est_saved',
        'due_date',
        'completed_at',
        'reminded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost' => 'float',
            'est_saved' => 'float',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'reminded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Generator, $this>
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(Generator::class);
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Who scheduled the service ("his maintenances").
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The team member responsible for carrying out this service.
     *
     * @return BelongsTo<User, $this>
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /** Mark this service completed now. */
    public function markCompleted(): void
    {
        $this->completed_at = now();
    }

    /** Clear completion along with its recorded cost and estimated savings. */
    public function reopen(): void
    {
        $this->completed_at = null;
        $this->cost = null;
        $this->est_saved = null;
    }

    /**
     * Record the cost paid and estimate the savings it returned (a preventive
     * service avoids a costlier emergency repair — see config/maintenance.php).
     */
    public function recordCost(?float $cost): void
    {
        $this->cost = $cost;
        $this->est_saved = $cost === null
            ? null
            : round($cost * (float) config('maintenance.savings_multiplier'), 2);
    }
}
