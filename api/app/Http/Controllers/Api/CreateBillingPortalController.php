<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreateBillingPortalController extends Controller
{
    /**
     * Return a Stripe billing-portal URL so the owner can update payment details
     * or cancel. Owner-only; requires an existing Stripe customer (i.e. they've
     * started a subscription at least once).
     *
     * POST /api/billing/portal
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($user->isOwner(), 403, 'Only the organization owner can manage billing.');
        abort_unless($organization->hasStripeId(), 409, 'No billing account yet — start a subscription first.');

        $validated = $request->validate([
            'return_url' => ['nullable', 'string', 'max:2048'],
        ]);

        // Stripe's portal returns to our `billing.return` web page, which bounces
        // back into the app via the deep link the client passed as `return_url`.
        $return = route('billing.return', array_filter([
            'status' => 'portal',
            'return' => $validated['return_url'] ?? null,
        ], fn ($v) => filled($v)));

        return response()->json([
            'url' => $organization->billingPortalUrl($return),
        ]);
    }
}
