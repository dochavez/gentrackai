<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendChatMessageRequest;
use App\Http\Resources\ChatMessageResource;
use App\Models\ChatConversation;
use App\Services\ChatAssistant;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * The user's assistant conversation history (empty on first open — the app
     * shows the greeting + suggested prompts).
     *
     * GET /api/chat
     */
    public function index(Request $request): JsonResponse
    {
        $conversation = $this->conversation($request);

        return response()->json([
            'messages' => ChatMessageResource::collection($conversation->messages()->orderBy('id')->get()),
        ]);
    }

    /**
     * Send a message and get the assistant's grounded reply. The model looks up
     * the fleet through user-scoped tools (see ChatAssistant). An optional photo
     * can be attached so the model can help identify a problem from an image.
     *
     * POST /api/chat
     */
    public function store(SendChatMessageRequest $request, ChatAssistant $assistant, PlanGate $plans): JsonResponse
    {
        $conversation = $this->conversation($request);

        // Plan gate: the Free plan caps AI chat per day; Pro is unlimited.
        $limit = $plans->chatDailyLimit($request->user()->organization);
        if ($limit !== null) {
            $usedToday = $conversation->messages()
                ->where('role', 'user')
                ->whereDate('created_at', today())
                ->count();

            if ($usedToday >= $limit) {
                return response()->json([
                    'message' => "You've reached today's AI chat limit on the Free plan. Upgrade to Pro for unlimited chat.",
                    'upgradeRequired' => true,
                    'feature' => 'chat',
                ], 402);
            }
        }

        $reply = $assistant->reply(
            $request->user(),
            $conversation,
            $request->string('message')->toString(),
            $request->file('image'),
        );

        return response()->json(['message' => new ChatMessageResource($reply)], 201);
    }

    /**
     * Clear the conversation — the app's "New chat" / delete action. Messages are
     * removed so the next open shows the greeting + suggested prompts again.
     *
     * DELETE /api/chat
     */
    public function destroy(Request $request): JsonResponse
    {
        $this->conversation($request)->messages()->delete();

        return response()->json(null, 204);
    }

    protected function conversation(Request $request): ChatConversation
    {
        return $request->user()->chatConversation()->firstOrCreate([]);
    }
}
