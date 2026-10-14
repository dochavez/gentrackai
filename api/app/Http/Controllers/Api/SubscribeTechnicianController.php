<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Start the technician-panel subscription (Cashier type 'technician') via hosted
 * Checkout and return its URL. Separate from the Pro ('default') subscription —
 * one org can hold both.
 *
 * POST /api/technician/billing/checkout
 */
class SubscribeTechnicianController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($organization->isProvider(), 403);
        abort_unless($user->canManageTeam(), 403, 'Only an owner or admin can manage billing.');

        // Already paying through the App Store / Play Store (see the Pro
        // checkout) — the store owns that renewal.
        abort_if(
            $organization->hasStoreSubscription('technician'),
            409,
            'This subscription is managed by the App Store. Manage it in your device settings.',
        );

        $validated = $request->validate([
            'interval' => ['nullable', 'string', 'in:monthly,yearly'],
            'return_url' => ['nullable', 'string', 'max:2048'],
        ]);
        $interval = $validated['interval'] ?? 'monthly';
        $priceId = config("plans.prices.technician_{$interval}");

        abort_if(blank($priceId), 422, 'The technician plan is not configured yet.');

        $return = $validated['return_url'] ?? null;
        $landing = fn (string $status) => route('billing.return', array_filter([
            'status' => $status,
            'return' => $return,
        ], fn ($v) => filled($v)));

        $checkout = $organization
            ->newSubscription('technician', $priceId)
            ->checkout([
                'success_url' => $landing('success'),
                'cancel_url' => $landing('cancel'),
            ]);

        return response()->json(['url' => $checkout->url]);
    }
}
