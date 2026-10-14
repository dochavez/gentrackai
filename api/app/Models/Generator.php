<?php

namespace App\Models;

use Database\Factories\GeneratorFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Generator extends Model
{
    /** @use HasFactory<GeneratorFactory> */
    use HasFactory;

    use SoftDeletes;

    /** Denormalize the org from the adding user's active org so fleet queries stay simple. */
    protected static function booted(): void
    {
        static::creating(function (Generator $generator): void {
            if (empty($generator->organization_id) && $generator->user_id) {
                $generator->organization_id = User::whereKey($generator->user_id)->value('current_organization_id');
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'organization_id',
        'name',
        'manufacturer',
        'model_number',
        'rated_power',
        'fuel_type',
        'type',
        'serial_number',
        'transfer_switch',
        'service_interval',
        'location',
        'status',
        'run_hours',
        'fuel_level',
        'battery_voltage',
        'fuel_burn_rate',
        'running_since',
        'fuel_reading_at',
        'run_hours_reading_at',
        'battery_reading_at',
        'installed_at',
        'image_path',
        'confidence',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'installed_at' => 'date',
            'run_hours' => 'float',
            'fuel_level' => 'float',
            'battery_voltage' => 'float',
            'fuel_burn_rate' => 'float',
            'running_since' => 'datetime',
            'fuel_reading_at' => 'datetime',
            'run_hours_reading_at' => 'datetime',
            'battery_reading_at' => 'datetime',
            'confidence' => 'integer',
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
     * @return HasMany<MaintenanceItem, $this>
     */
    public function maintenanceItems(): HasMany
    {
        return $this->hasMany(MaintenanceItem::class);
    }

    /**
     * @return HasMany<GeneratorReading, $this>
     */
    public function readings(): HasMany
    {
        return $this->hasMany(GeneratorReading::class);
    }

    /** Whether the generator is actively consuming (its usage clock is ticking). */
    public function isRunning(): bool
    {
        return $this->status === 'running' && $this->running_since !== null;
    }
}
