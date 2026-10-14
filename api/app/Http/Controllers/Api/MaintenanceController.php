<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMaintenanceItemRequest;
use App\Http\Requests\UpdateMaintenanceItemRequest;
use App\Http\Resources\MaintenanceItemResource;
use App\Models\Generator;
use App\Models\MaintenanceItem;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    /**
     * Maintenance schedule for one of the user's generators.
     *
     * GET /api/generators/{generator}/maintenance
     */
    public function index(Request $request, Generator $generator): JsonResponse
    {
        $user = $request->user();
        abort_unless($generator->organization_id === $user->organization_id, 403);

        // Members see the services they scheduled; owner/admin see all.
        $items = $generator->maintenanceItems()
            ->when(! $user->canManageTeam(), fn ($q) => $q->where('user_id', $user->id))
            ->with('assignee')
            ->orderBy('due_date')
            ->get();

        return response()->json([
            'items' => MaintenanceItemResource::collection($items),
            'recommendedCycle' => $generator->service_interval ?: 'Oil every 200 run hours · full service twice a year',
        ]);
    }

    /**
     * Schedule a maintenance item for the generator.
     *
     * POST /api/generators/{generator}/maintenance
     */
    public function store(StoreMaintenanceItemRequest $request, Generator $generator): JsonResponse
    {
        abort_unless($generator->organization_id === $request->user()->organization_id, 403);

        // Stamp the creator ("his maintenances"); the org is filled from the generator.
        $item = $generator->maintenanceItems()->create(
            $request->validated() + ['user_id' => $request->user()->id]
        );
        $item->load('assignee');

        Notification::create([
            'user_id' => $request->user()->id,
            'type' => 'maintenance',
            'icon' => '🔧',
            'title' => 'Maintenance scheduled',
            'body' => $item->title.' · '.$generator->name,
        ]);

        // Notify the assignee too, unless they scheduled it for themselves.
        if ($item->assignee_id !== null && $item->assignee_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $item->assignee_id,
                'type' => 'maintenance',
                'icon' => '🔧',
                'title' => 'Maintenance assigned',
                'body' => $item->title.' · '.$generator->name,
            ]);
        }

        return response()->json(['item' => new MaintenanceItemResource($item)], 201);
    }

    /**
     * Mark a service done (with the cost paid) or reopen it. Completing a
     * service estimates the savings it returned (see config/maintenance.php).
     *
     * PATCH /api/generators/{generator}/maintenance/{maintenanceItem}
     */
    public function update(
        UpdateMaintenanceItemRequest $request,
        Generator $generator,
        MaintenanceItem $maintenanceItem
    ): JsonResponse {
        $user = $request->user();
        abort_unless($generator->organization_id === $user->organization_id, 403);
        abort_unless($maintenanceItem->generator_id === $generator->id, 404);
        // Members may only complete/reopen services they scheduled.
        abort_unless($user->canManageTeam() || $maintenanceItem->user_id === $user->id, 403);

        // Reopening a service clears its completion and recorded cost.
        if ($request->has('done') && ! $request->boolean('done')) {
            $maintenanceItem->reopen();
            $maintenanceItem->save();

            return response()->json(['item' => new MaintenanceItemResource($maintenanceItem)]);
        }

        if ($request->boolean('done')) {
            $maintenanceItem->markCompleted();
        }

        if ($request->has('cost')) {
            $cost = $request->input('cost');
            $maintenanceItem->recordCost($cost !== null ? (float) $cost : null);
        }

        $maintenanceItem->save();

        return response()->json(['item' => new MaintenanceItemResource($maintenanceItem)]);
    }
}
