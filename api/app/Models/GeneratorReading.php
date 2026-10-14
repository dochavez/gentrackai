<?php

namespace App\Models;

use Database\Factories\GeneratorReadingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GeneratorReading extends Model
{
    /** @use HasFactory<GeneratorReadingFactory> */
    use HasFactory;

    public const METRICS = ['fuel', 'run_hours', 'battery'];

    /**
     * @var list<string>
     */
    protected $fillable = [
        'metric',
        'value',
        'note',
        'recorded_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'float',
            'recorded_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Generator, $this>
     */
    public function generator(): BelongsTo
    {
        return $this->belongsTo(Generator::class);
    }
}
