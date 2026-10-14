<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Insight;
use App\Services\FleetAnalytics;
use App\Services\InsightService;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightController extends Controller
{
    /**
     * Insights for the authenticated user's fleet: always-fresh deterministic
     * analytics plus the cached AI recommendation. Reading this enqueues a
     * background regeneration only when the AI cache is stale (never inline).
     *
     * GET /api/insights
     */
    public function index(Request $request, FleetAnalytics $analytics, InsightService $service, PlanGate $plans): JsonResponse
    {
        $organization = $request->user()->organization;

        $data = $analytics->build($organization);

        // Deterministic analytics are always free; the AI recommendation is Pro
        // only (and gating it here avoids spending Gemini tokens on Free orgs).
        if (! $plans->allowsInsights($organization)) {
            return response()->json([
                'analytics' => $data,
                'ai' => null,
                'aiPending' => false,
                'aiLocked' => true,
            ]);
        }

        $service->refreshIfStale($organization);

        $insight = $organization->insight()->first();

        return response()->json([
            'analytics' => $data,
            'ai' => $this->aiPayload($insight),
            'aiPending' => $insight === null || $insight->payload === null || $insight->generating,
            'aiLocked' => false,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function aiPayload(?Insight $insight): ?array
    {
        if (! $insight || $insight->payload === null) {
            return null;
        }

        return [
            'recommendations' => $insight->payload['recommendations'] ?? [],
            'generatedAgo' => $insight->generated_at?->diffForHumans(),
        ];
    }
}
