<?php

namespace Tests;

use App\Models\Organization;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;
use Laravel\Cashier\Subscription;

abstract class TestCase extends BaseTestCase
{
    /**
     * Put an organization on the Pro plan by creating a valid local subscription
     * row (no Stripe call) — `onPro()` reads the subscriptions table, so this is
     * enough to exercise Pro-gated behavior in tests.
     */
    protected function subscribeToPro(Organization $organization, string $status = 'active'): Subscription
    {
        return $organization->subscriptions()->create([
            'type' => 'default',
            'stripe_id' => 'sub_'.Str::random(14),
            'stripe_status' => $status,
            'stripe_price' => 'price_test_pro',
            'quantity' => 1,
        ]);
    }
}
