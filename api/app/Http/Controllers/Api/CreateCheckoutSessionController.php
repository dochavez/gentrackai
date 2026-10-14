<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreateCheckoutSessionController extends Controller
{
    /**
     * Start a Stripe Checkout session for the Pro plan and return its URL for the
     * app to open in a browser (web Checkout — no in-app IAP). Owner-only, since
     * billing is the organization owner's responsibility.
     *
     * POST /api/billing/checkout
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($user->isOwner(), 403, 'Only the organization owner can manage billing.');

        // Already paying through the App Store / Play Store — a second Stripe
        // subscription would double-bill, and the store owns that renewal.
        abort_if(
            $organization->hasStoreSubscription('default'),
            409,
            'This subscription is managed by the App Store. Manage it in your device settings.',
        );

        $validated = $request->validate([
            'interval' => ['nullable', 'string', 'in:monthly,yearly'],
            'return_url' => ['nullable', 'string', 'max:2048'],
        ]);
        $interval = $validated['interval'] ?? 'monthly';
        $priceId = config("plans.prices.pro_{$interval}");

        abort_if(blank($priceId), 422, 'The Pro plan is not configured yet.');

        // Stripe returns to our `billing.return` web page, which bounces back
        // into the app via the deep link the client passed as `return_url`.
        $return = $validated['return_url'] ?? null;
        $landing = fn (string $status) => route('billing.return', array_filter([
            'status' => $status,
            'return' => $return,
        ], fn ($v) => filled($v)));

        $checkout = $organization
            ->newSubscription('default', $priceId)
            ->checkout([
                'success_url' => $landing('success'),
                'cancel_url' => $landing('cancel'),
            ]);

        return response()->json(['url' => $checkout->url]);
    }
}
