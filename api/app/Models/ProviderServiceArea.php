<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One US state a provider org serves. Requests in that state are shown to the
 * provider's technician feed.
 */
class ProviderServiceArea extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'provider_organization_id',
        'state',
    ];

    /**
     * @return BelongsTo<Organization, $this>
     */
    public function providerOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'provider_organization_id');
    }
}
