<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGeneratorRequest;
use App\Http\Requests\UpdateGeneratorRequest;
use App\Http\Resources\GeneratorResource;
use App\Models\Generator;
use App\Services\GeneratorUsage;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeneratorController extends Controller
{
    /**
     * List the organization's generators — the fleet is shared, so every member
     * sees all of them.
     *
     * GET /api/generators
     */
    public function index(Request $request): JsonResponse
    {
        $generators = $request->user()->organization->generators()->latest()->get();

        return response()->json([
            'generators' => GeneratorResource::collection($generators),
        ]);
    }

    /**
     * Show one of the organization's generators.
     *
     * GET /api/generators/{generator}
     */
    public function show(Request $request, Generator $generator): JsonResponse
    {
        abort_unless($generator->organization_id === $request->user()->organization_id, 403);

        return response()->json([
            'generator' => new GeneratorResource($generator),
        ]);
    }

    /**
     * Add a generator to the authenticated user (typically the confirmed scan
     * result). Stores the label photo when one is provided.
     *
     * POST /api/generators
     */
    public function store(StoreGeneratorRequest $request, PlanGate $plans): JsonResponse
    {
        // Plan gate: the Free plan caps the fleet size; Pro is unlimited.
        if (! $plans->canAddGenerator($request->user()->organization)) {
            return response()->json([
                'message' => "You've reached the generator limit on the Free plan. Upgrade to Pro to add more.",
                'upgradeRequired' => true,
                'feature' => 'generators',
            ], 402);
        }

        // Guarantee uniqueness by serial number within the organization's fleet.
        $serial = $request->input('serial_number');
        if (filled($serial)) {
            $existing = $request->user()->organization->generators()
                ->where('serial_number', $serial)
                ->first();

            if ($existing !== null) {
                return response()->json([
                    'message' => 'This generator is already in your fleet.',
                    'generator' => new GeneratorResource($existing),
                ], 409);
            }
        }

        $data = $request->safe()->except('image');

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('generators', 'public');
        }

        $generator = $request->user()->generators()->create($data);

        if ($generator->status === 'running' && $generator->running_since === null) {
            $generator->forceFill(['running_since' => now()])->save();
        }

        return response()->json([
            'generator' => new GeneratorResource($generator),
        ], 201);
    }

    /**
     * Edit a generator's details. Status changes and fuel/run-hours/battery
     * values are routed through the usage service so consumption projection
     * stays consistent (each value change is logged as a reading).
     *
     * PATCH /api/generators/{generator}
     */
    public function update(UpdateGeneratorRequest $request, Generator $generator, GeneratorUsage $usage): JsonResponse
    {
        abort_unless($generator->organization_id === $request->user()->organization_id, 403);

        $data = $request->safe();

        if ($data->has('status')) {
            $usage->applyStatus($generator, $data['status']);
        }

        $metrics = ['fuel' => 'fuel_level', 'run_hours' => 'run_hours', 'battery' => 'battery_voltage'];
        foreach ($metrics as $metric => $field) {
            if ($data->has($field) && $data[$field] !== null) {
                $usage->record($generator, $metric, (float) $data[$field]);
            }
        }

        $plain = $data->only([
            'name', 'manufacturer', 'model_number', 'rated_power', 'fuel_type',
            'type', 'serial_number', 'transfer_switch', 'service_interval',
            'location', 'fuel_burn_rate',
        ]);

        if ($request->hasFile('image')) {
            $plain['image_path'] = $request->file('image')->store('generators', 'public');
        }

        if ($plain !== []) {
            $generator->fill($plain)->save();
        }

        return response()->json([
            'generator' => new GeneratorResource($generator->fresh()),
        ]);
    }

    /**
     * Soft-delete a generator. It (and its tasks/maintenance) drop out of the
     * app; the record is retained and can be restored.
     *
     * DELETE /api/generators/{generator}
     */
    public function destroy(Request $request, Generator $generator): JsonResponse
    {
        abort_unless($generator->organization_id === $request->user()->organization_id, 403);

        $generator->delete();

        return response()->json(null, 204);
    }
}
