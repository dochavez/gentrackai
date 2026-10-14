<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PlanGate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    /**
     * The organization's billing status: current plan, entitlements, usage, and
     * whether the caller may manage billing. Any member of the org may read it.
     *
     * GET /api/billing
     */
    public function show(Request $request, PlanGate $plans): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        $subscription = $organization->subscription('default');

        return response()->json([
            'plan' => $organization->planKey(),
            'subscribed' => $organization->onPro(),
            'onGracePeriod' => (bool) $subscription?->onGracePeriod(),
            'endsAt' => $subscription?->ends_at?->toDateString(),
            // Which channel bills this org: 'stripe' (web/Android Checkout),
            // 'app_store'/'play_store' (In-App Purchase), or null when on Free.
            // The app uses it to send iOS users to the system subscription
            // settings instead of the Stripe portal.
            'source' => $organization->subscriptionSource('default'),
            'limits' => [
                'generators' => $plans->generatorLimit($organization),
                'members' => $plans->memberLimit($organization),
                'insights' => $plans->allowsInsights($organization),
                'chatDaily' => $plans->chatDailyLimit($organization),
            ],
            'usage' => [
                'generators' => $organization->generators()->count(),
                'members' => $organization->members()->count(),
            ],
            'pro' => [
                'monthlyLabel' => config('plans.pricing.monthly_label'),
                'yearlyLabel' => config('plans.pricing.yearly_label'),
                'yearlyNote' => config('plans.pricing.yearly_note'),
            ],
            'canManageBilling' => $user->isOwner(),
        ]);
    }
}
