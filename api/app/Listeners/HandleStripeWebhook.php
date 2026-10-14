<?php

namespace App\Listeners;

use App\Models\Organization;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookReceived;
use Throwable;

/**
 * Listens to Cashier's WebhookReceived (fired for every verified Stripe event).
 * When a setup-mode Checkout completes, it promotes the captured card to the
 * customer's default payment method and flips the provider's `payment_ready`
 * flag so the technician panel unlocks and the free trial begins.
 *
 * Requires the Stripe webhook (STRIPE_WEBHOOK_SECRET) to be configured and
 * subscribed to `checkout.session.completed` / `setup_intent.succeeded`.
 */
class HandleStripeWebhook
{
    public function handle(WebhookReceived $event): void
    {
        $type = $event->payload['type'] ?? null;
        $object = $event->payload['data']['object'] ?? [];

        $isSetupCheckout = $type === 'checkout.session.completed' && ($object['mode'] ?? null) === 'setup';
        $isSetupIntent = $type === 'setup_intent.succeeded';

        if (! $isSetupCheckout && ! $isSetupIntent) {
            return;
        }

        $customerId = $object['customer'] ?? null;
        if (blank($customerId)) {
            return;
        }

        /** @var Organization|null $organization */
        $organization = Cashier::findBillable($customerId);
        $profile = $organization?->providerProfile;
        if ($profile === null) {
            return;
        }

        // Promote the captured card to the default PM (best effort).
        try {
            $setupIntentId = $isSetupIntent ? ($object['id'] ?? null) : ($object['setup_intent'] ?? null);
            if (filled($setupIntentId)) {
                $paymentMethod = $organization->stripe()->setupIntents->retrieve($setupIntentId)->payment_method;
                if (filled($paymentMethod)) {
                    $organization->updateDefaultPaymentMethod($paymentMethod);
                }
            }
        } catch (Throwable) {
            // Non-fatal: the flag below still unlocks the panel; the customer can
            // complete/subscribe via hosted Checkout which re-collects the card.
        }

        $profile->update(['payment_ready' => true]);
    }
}
