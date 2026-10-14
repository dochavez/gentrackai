<?php

namespace App\Services;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Generator;
use App\Models\MaintenanceItem;
use App\Models\User;
use App\Support\GeminiRetry;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Prism\Prism\Enums\Provider;
use Prism\Prism\Facades\Prism;
use Prism\Prism\Facades\Tool;
use Prism\Prism\ValueObjects\Media\Image;
use Prism\Prism\ValueObjects\Messages\AssistantMessage;
use Prism\Prism\ValueObjects\Messages\UserMessage;

/**
 * The "GenTrack AI" chat assistant. Answers questions about the user's fleet by
 * giving Gemini (via Prism) a set of read-only tools scoped to that user — the
 * model retrieves only the data each question needs (tool calling, not RAG).
 * The app never calls Gemini; it posts a message and gets the reply back.
 */
class ChatAssistant
{
    /** Only the most recent turns are replayed to keep prompts bounded. */
    private const HISTORY_LIMIT = 20;

    public function __construct(
        private FleetAnalytics $analytics,
        private GeneratorUsage $usage,
    ) {}

    /** Append the user's message, generate a grounded reply, persist and return it. */
    public function reply(User $user, ChatConversation $conversation, string $message, ?UploadedFile $image = null): ChatMessage
    {
        $conversation->messages()->create([
            'role' => 'user',
            'content' => $message,
            'image_path' => $image?->store('chat', 'public'),
        ]);

        $response = Prism::text()
            ->using(Provider::Gemini, config('services.gemini.model'))
            ->withClientRetry(...GeminiRetry::options())
            ->withSystemPrompt($this->systemPrompt())
            ->withTools($this->tools($user))
            ->withMaxSteps(6)
            ->withMessages($this->history($conversation))
            ->asText();

        return $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $response->text,
        ]);
    }

    /** Prompt used for an image-only turn so the model knows what to do with the photo. */
    private const IMAGE_ONLY_PROMPT = 'I\'m sharing this photo of my generator. Read any nameplate/model/serial or fault codes you can see and help me identify the unit or the problem.';

    /**
     * @return list<UserMessage|AssistantMessage>
     */
    protected function history(ChatConversation $conversation): array
    {
        return $conversation->messages()
            ->latest('id')
            ->take(self::HISTORY_LIMIT)
            ->get()
            ->reverse()
            ->map(fn (ChatMessage $m) => $m->role === 'assistant'
                ? new AssistantMessage($m->content)
                : $this->userMessage($m))
            ->values()
            ->all();
    }

    /** Build a user turn, attaching the stored photo (if any) so Gemini can see it. */
    protected function userMessage(ChatMessage $m): UserMessage
    {
        $images = [];
        if ($m->image_path && Storage::disk('public')->exists($m->image_path)) {
            $images[] = Image::fromLocalPath(Storage::disk('public')->path($m->image_path));
        }

        $text = $m->content !== '' ? $m->content : ($images !== [] ? self::IMAGE_ONLY_PROMPT : '');

        return new UserMessage($text, $images);
    }

    protected function systemPrompt(): string
    {
        return 'You are GenTrack AI, the assistant inside a generator-fleet app, talking to the fleet owner. '.
            'Use the provided tools to look up their actual generators, maintenance, tasks and analytics before '.
            'answering — always ground answers in tool results. If the tools do not have the answer, say so '.
            'plainly; never invent model numbers, specs, readings or dates. Be concise, practical and friendly, '.
            'and give maintenance guidance appropriate to standby/backup generators. '.
            'Format replies in light markdown: **bold** for key terms, short bullet lists where helpful. '.
            'Ignore non-fleet questions (e.g., "What is the weather?") and respond with "I can only answer questions about your generator fleet." '.
            'Avoid large headings (no "#"/"##"); keep answers scannable.';
    }

    /**
     * Read-only, user-scoped tools the model may call.
     *
     * @return list<\Prism\Prism\Tool>
     */
    protected function tools(User $user): array
    {
        $organization = $user->organization;

        return [
            Tool::as('list_generators')
                ->for("List all of the organization's generators with current status and projected fuel, run hours and battery.")
                ->using(fn (): string => (string) json_encode([
                    'generators' => $organization->generators()->get()->map(fn (Generator $g) => $this->summary($g))->all(),
                ])),

            Tool::as('get_generator')
                ->for('Full details for one generator by (partial) name: specs, projection, recent readings, maintenance, open tasks.')
                ->withStringParameter('name', 'The generator name or part of it.')
                ->using(function (string $name) use ($organization): string {
                    $g = $organization->generators()->where('name', 'like', '%'.$name.'%')->first();
                    if ($g === null) {
                        return (string) json_encode(['error' => "No generator matching \"{$name}\"."]);
                    }

                    return (string) json_encode([
                        'generator' => $this->summary($g),
                        'recentReadings' => $g->readings()->latest('recorded_at')->take(5)->get()
                            ->map(fn ($r) => ['metric' => $r->metric, 'value' => $r->value, 'recordedAt' => $r->recorded_at?->toDateString()])->all(),
                        'maintenance' => $g->maintenanceItems()->orderBy('due_date')->get()
                            ->map(fn ($m) => ['title' => $m->title, 'done' => $m->completed_at !== null, 'dueDate' => $m->due_date?->toDateString(), 'cost' => $m->cost])->all(),
                        'openTasks' => $organization->tasks()->where('generator_id', $g->id)
                            ->whereNull('completed_at')->pluck('title')->all(),
                    ]);
                }),

            Tool::as('list_maintenance')
                ->for('List scheduled and overdue maintenance across the fleet (optionally for one generator by name).')
                ->withStringParameter('generator', 'Optional generator name to filter by.', false)
                ->using(function (?string $generator = null) use ($user, $organization): string {
                    $items = MaintenanceItem::query()
                        ->whereHas('generator', fn ($q) => $q->where('organization_id', $organization->id)
                            ->when($generator, fn ($x) => $x->where('name', 'like', '%'.$generator.'%')))
                        ->when(! $user->canManageTeam(), fn ($q) => $q->where('user_id', $user->id))
                        ->with('generator')
                        ->orderBy('due_date')
                        ->get()
                        ->map(fn ($m) => [
                            'generator' => $m->generator?->name,
                            'title' => $m->title,
                            'done' => $m->completed_at !== null,
                            'dueDate' => $m->due_date?->toDateString(),
                        ])->all();

                    return (string) json_encode(['maintenance' => $items]);
                }),

            Tool::as('list_open_tasks')
                ->for('List open (incomplete) tasks with their generator and due date.')
                ->using(function () use ($user, $organization): string {
                    $query = $organization->tasks()->whereHas('generator')->whereNull('completed_at');
                    if (! $user->canManageTeam()) {
                        $query->where(fn ($q) => $q->where('user_id', $user->id)->orWhere('assignee_id', $user->id));
                    }

                    return (string) json_encode([
                        'tasks' => $query->with('generator')->get()
                            ->map(fn ($t) => ['title' => $t->title, 'generator' => $t->generator?->name, 'dueDate' => $t->due_date?->toDateString()])->all(),
                    ]);
                }),

            Tool::as('fleet_analytics')
                ->for('Computed fleet analytics: health score, weekly run hours, trend and 30-day forecast.')
                ->using(fn (): string => (string) json_encode($this->analytics->build($organization))),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function summary(Generator $generator): array
    {
        $snapshot = $this->usage->snapshot($generator);

        return [
            'name' => $generator->name,
            'status' => $generator->status,
            'manufacturer' => $generator->manufacturer,
            'model' => $generator->model_number,
            'ratedPower' => $generator->rated_power,
            'fuelType' => $generator->fuel_type,
            'runHours' => $snapshot['runHours'],
            'fuelLevel' => $snapshot['fuelLevel'],
            'batteryVoltage' => $snapshot['batteryVoltage'],
            'serviceInterval' => $generator->service_interval,
            'location' => $generator->location,
        ];
    }
}
