<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     */
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)->latest()->get();

        return response()->json([
            'notifications' => NotificationResource::collection($notifications),
            'unreadCount' => $notifications->whereNull('read_at')->count(),
        ]);
    }

    /**
     * PATCH /api/notifications/{notification} — mark one as read.
     */
    public function update(Request $request, Notification $notification): JsonResponse
    {
        abort_unless($notification->user_id === $request->user()->id, 403);

        $notification->update(['read_at' => now()]);

        return response()->json(['notification' => new NotificationResource($notification)]);
    }
}
