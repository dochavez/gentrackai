<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TechnicianStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianBillingController extends Controller
{
    /**
     * Technician-panel billing status: subscription/trial state plus the price
     * labels the app shows. Any member of a provider org may read it.
     *
     * GET /api/technician/billing
     */
    public function show(Request $request, TechnicianStatus $status): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;
        abort_unless($organization->isProvider(), 403);

        $subscription = $organization->subscription('technician');

        return response()->json([
            'billing' => $status->for($user) + [
                'onGracePeriod' => (bool) $subscription?->onGracePeriod(),
                'endsAt' => $subscription?->ends_at?->toDateString(),
                'pricing' => [
                    'monthlyLabel' => config('plans.technician.pricing.monthly_label'),
                    'yearlyLabel' => config('plans.technician.pricing.yearly_label'),
                    'yearlyNote' => config('plans.technician.pricing.yearly_note'),
                ],
            ],
        ]);
    }
}
