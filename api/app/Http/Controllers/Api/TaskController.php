<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Notification;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * List the user's tasks. `?filter=all|overdue|assigned|unassigned`.
     *
     * GET /api/tasks
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        // Owner/admin see every task in the org; members see the ones they
        // created or are assigned. `whereHas('generator')` drops tasks whose
        // generator was soft-deleted (from both the list and the counts).
        $active = fn () => $user->canManageTeam()
            ? $user->organization->tasks()->whereHas('generator')
            : $user->organization->tasks()->whereHas('generator')->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('assignee_id', $user->id);
            });

        $query = $active()->with(['generator', 'assignee'])->latest();

        $query = match ($request->query('filter', 'all')) {
            'overdue' => $query->whereNull('completed_at')->whereNotNull('due_date')->whereDate('due_date', '<', today()),
            'assigned' => $query->where('assignee_id', $user->id),
            'unassigned' => $query->whereNull('assignee_id'),
            default => $query,
        };

        return response()->json([
            'tasks' => TaskResource::collection($query->get()),
            'counts' => [
                'all' => $active()->count(),
                'overdue' => $active()->whereNull('completed_at')->whereNotNull('due_date')->whereDate('due_date', '<', today())->count(),
                'assigned' => $active()->where('assignee_id', $user->id)->count(),
                'unassigned' => $active()->whereNull('assignee_id')->count(),
            ],
        ]);
    }

    /**
     * POST /api/tasks
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $task = $request->user()->tasks()->create(
            $request->safe()->only(['generator_id', 'assignee_id', 'title', 'due_date'])
        );
        $task->load(['generator', 'assignee']);

        // Notify the assignee (unless they assigned it to themselves).
        if ($task->assignee_id !== null && $task->assignee_id !== $request->user()->id) {
            Notification::create([
                'user_id' => $task->assignee_id,
                'type' => 'task',
                'icon' => '🛠️',
                'title' => 'New task assigned',
                'body' => $task->title.' · '.($task->generator?->name ?? 'a generator'),
            ]);
        }

        return response()->json(['task' => new TaskResource($task)], 201);
    }

    /**
     * PATCH /api/tasks/{task} — toggle done, reassign, or edit.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $user = $request->user();
        abort_unless($task->organization_id === $user->organization_id, 403);
        // Members may only touch their own or assigned tasks; owner/admin any.
        abort_unless(
            $user->canManageTeam() || $task->user_id === $user->id || $task->assignee_id === $user->id,
            403
        );

        $data = $request->safe()->only(['title', 'assignee_id', 'due_date']);
        if ($request->has('done')) {
            $data['completed_at'] = $request->boolean('done') ? now() : null;
        }

        $task->update($data);
        $task->load(['generator', 'assignee']);

        return response()->json(['task' => new TaskResource($task)]);
    }

    /**
     * DELETE /api/tasks/{task}
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $user = $request->user();
        abort_unless($task->organization_id === $user->organization_id, 403);
        abort_unless($user->canManageTeam() || $task->user_id === $user->id, 403);

        $task->delete();

        return response()->json(null, 204);
    }
}
