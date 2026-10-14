<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGeneratorReadingRequest;
use App\Http\Resources\GeneratorReadingResource;
use App\Http\Resources\GeneratorResource;
use App\Models\Generator;
use App\Services\GeneratorUsage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class GeneratorReadingController extends Controller
{
    /**
     * Usage-reading history for one of the user's generators.
     *
     * GET /api/generators/{generator}/readings
     */
    public function index(Request $request, Generator $generator): JsonResponse
    {
        abort_unless($generator->organization_id === $request->user()->organization_id, 403);

        $readings = $generator->readings()
            ->when(
                $request->filled('metric'),
                fn ($query) => $query->where('metric', $request->string('metric')),
            )
            ->latest('recorded_at')
            ->get();

        return response()->json([
            'readings' => GeneratorReadingResource::collection($readings),
        ]);
    }

    /**
     * Log a usage reading (fuel %, run hours, or battery volts). Re-anchors the
     * generator's consumption projection and returns its fresh snapshot.
     *
     * POST /api/generators/{generator}/readings
     */
    public function store(StoreGeneratorReadingRequest $request, Generator $generator, GeneratorUsage $usage): JsonResponse
    {
        abort_unless($generator->organization_id === $request->user()->organization_id, 403);

        $reading = $usage->record(
            $generator,
            $request->string('metric'),
            (float) $request->input('value'),
            $request->filled('recorded_at') ? Carbon::parse($request->input('recorded_at')) : null,
            $request->input('note'),
        );

        return response()->json([
            'reading' => new GeneratorReadingResource($reading),
            'generator' => new GeneratorResource($generator->fresh()),
        ], 201);
    }
}
