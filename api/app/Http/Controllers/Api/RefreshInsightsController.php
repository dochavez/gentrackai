<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\InsightService;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RefreshInsightsController extends Controller
{
    /**
     * Force a regeneration of the AI recommendation (rate-limited by the route).
     * Queued — returns immediately; the app picks up the result on its next read.
     * Pro-only, since the AI recommendation is a Pro feature.
     *
     * POST /api/insights/refresh
     */
    public function __invoke(Request $request, InsightService $service, PlanGate $plans): JsonResponse
    {
        $organization = $request->user()->organization;

        if (! $plans->allowsInsights($organization)) {
            return response()->json([
                'message' => 'AI insights are a Pro feature. Upgrade to unlock them.',
                'upgradeRequired' => true,
                'feature' => 'insights',
            ], 402);
        }

        $service->forceRefresh($organization);

        return response()->json(['status' => 'queued'], 202);
    }
}
