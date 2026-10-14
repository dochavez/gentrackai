<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Marks an organization as a technician provider and holds its public-facing
 * profile plus the aggregates that power the usage-based free trial and the
 * public rating.
 */
class ProviderProfile extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'business_name',
        'phone',
        'bio',
        'logo_path',
        'rating_avg',
        'ratings_count',
        'jobs_completed',
        'payment_ready',
        'onboarded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating_avg' => 'float',
            'ratings_count' => 'integer',
            'jobs_completed' => 'integer',
            'payment_ready' => 'boolean',
            'onboarded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Reviews for this provider (keyed by organization, since a review points at
     * the provider org, not this profile row).
     *
     * @return HasMany<MaintenanceReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(MaintenanceReview::class, 'provider_organization_id', 'organization_id')->latest();
    }
}
