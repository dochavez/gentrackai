<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;
use Stripe\Checkout\Session;

/**
 * Capture a payment method up front (no charge) via a setup-mode Stripe Checkout
 * session, so the technician panel unlocks and the usage-based free trial begins.
 * The captured card is promoted to default by the webhook (HandleStripeWebhook).
 *
 * POST /api/technician/billing/setup
 */
class SetupTechnicianPaymentController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        $organization = $user->organization;

        abort_unless($organization->isProvider(), 403);
        abort_unless($user->canManageTeam(), 403, 'Only an owner or admin can manage billing.');

        $validated = $request->validate([
            'return_url' => ['nullable', 'string', 'max:2048'],
        ]);
        $return = $validated['return_url'] ?? null;
        $landing = fn (string $status) => route('billing.return', array_filter([
            'status' => $status,
            'return' => $return,
        ], fn ($v) => filled($v)));

        // Setup mode has no line items to infer currency from, so Stripe requires
        // it explicitly.
        $checkout = Checkout::create($organization, [
            'mode' => Session::MODE_SETUP,
            'currency' => config('cashier.currency', 'usd'),
            'success_url' => $landing('success'),
            'cancel_url' => $landing('cancel'),
        ]);

        return response()->json(['url' => $checkout->url]);
    }
}
