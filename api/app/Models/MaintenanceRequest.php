<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * A marketplace maintenance request. Lifecycle:
 *
 *   open → accepted → scheduled → completed
 *          (either, before scheduled) → cancelled
 *
 * A review is a follow-up row (see review()), not a status. Transitions are the
 * guarded methods below; controllers wrap the status-changing ones in a
 * transaction with a re-read to serialize races (e.g. double-accept).
 */
class MaintenanceRequest extends Model
{
    use SoftDeletes;

    public const STATUS_OPEN = 'open';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    /** Denormalize the customer org and snapshot the state from the creator. */
    protected static function booted(): void
    {
        static::creating(function (MaintenanceRequest $request): void {
            if ($request->created_by && (empty($request->organization_id) || empty($request->state))) {
                $creator = User::whereKey($request->created_by)->first();
                $request->organization_id ??= $creator?->current_organization_id;
                $request->state ??= $creator?->state;
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'generator_id',
        'created_by',
        'state',
        'detail',
        'status',
        'provider_organization_id',
        'accepted_offer_id',
        'assigned_technician_id',
        'scheduled_at',
        'completed_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * The requesting (customer) organization.
     *
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
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * The provider org that won the job (once accepted).
     *
     * @return BelongsTo<Organization, $this>
     */
    public function providerOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'provider_organization_id');
    }

    /**
     * The provider-org member carrying out the job.
     *
     * @return BelongsTo<User, $this>
     */
    public function assignedTechnician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    /**
     * @return HasMany<MaintenanceOffer, $this>
     */
    public function offers(): HasMany
    {
        return $this->hasMany(MaintenanceOffer::class);
    }

    /**
     * The accepted offer (pointer, not an FK — see the migration).
     *
     * @return BelongsTo<MaintenanceOffer, $this>
     */
    public function acceptedOffer(): BelongsTo
    {
        return $this->belongsTo(MaintenanceOffer::class, 'accepted_offer_id');
    }

    /**
     * @return HasOne<MaintenanceReview, $this>
     */
    public function review(): HasOne
    {
        return $this->hasOne(MaintenanceReview::class);
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    /**
     * open → accepted. Assigns the winning offer; solo providers get their
     * technician set immediately, companies assign one later.
     */
    public function markAccepted(MaintenanceOffer $offer, ?int $assignedTechnicianId): void
    {
        $this->status = self::STATUS_ACCEPTED;
        $this->provider_organization_id = $offer->provider_organization_id;
        $this->accepted_offer_id = $offer->id;
        $this->assigned_technician_id = $assignedTechnicianId;
    }

    /** accepted → scheduled (requires an assigned technician — enforced in the controller). */
    public function markScheduled(\DateTimeInterface $at): void
    {
        $this->status = self::STATUS_SCHEDULED;
        $this->scheduled_at = $at;
    }

    /** scheduled → completed. */
    public function markCompleted(): void
    {
        $this->status = self::STATUS_COMPLETED;
        $this->completed_at = now();
    }

    /** open|accepted → cancelled (before work is scheduled). */
    public function markCancelled(): void
    {
        $this->status = self::STATUS_CANCELLED;
    }
}
