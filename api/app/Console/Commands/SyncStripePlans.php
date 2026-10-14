<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\StripeClient;

class SyncStripePlans extends Command
{
    /**
     * @var string
     */
    protected $signature = 'stripe:sync-plans {--monthly=1499 : Pro monthly price in cents} {--yearly=14999 : Pro yearly price in cents} {--tech-monthly=999 : Technician monthly price in cents} {--tech-yearly=9999 : Technician yearly price in cents}';

    /**
     * @var string
     */
    protected $description = 'Create (idempotently) the GenTrack Pro product + monthly/yearly prices in Stripe and print the env lines.';

    public function handle(): int
    {
        $secret = config('cashier.secret');

        if (blank($secret)) {
            $this->error('STRIPE_SECRET is not set. Add your (test) secret key to .env first.');

            return self::FAILURE;
        }

        $stripe = new StripeClient($secret);
        $mode = str_starts_with((string) $secret, 'sk_live_') ? 'LIVE' : 'TEST';
        $currency = strtolower((string) config('cashier.currency', 'usd'));
        $this->info("Using {$mode} mode · currency {$currency}.");

        // Find the "GenTrack Pro" product (idempotent), else create it.
        $product = collect($stripe->products->all(['limit' => 100, 'active' => true])->data)
            ->first(fn ($p) => $p->name === 'GenTrack Pro')
            ?? $stripe->products->create([
                'name' => 'GenTrack Pro',
                'description' => 'Unlimited fleet, unlimited team, unlimited AI chat, and AI insights.',
                'metadata' => ['gentrack_plan' => 'pro'],
            ]);

        $monthly = $this->findOrCreatePrice($stripe, $product->id, 'month', (int) $this->option('monthly'), $currency, 'gentrack_pro_monthly');
        $yearly = $this->findOrCreatePrice($stripe, $product->id, 'year', (int) $this->option('yearly'), $currency, 'gentrack_pro_yearly');

        // Technician panel product + prices (a separate subscription).
        $techProduct = collect($stripe->products->all(['limit' => 100, 'active' => true])->data)
            ->first(fn ($p) => $p->name === 'GenTrack Technician')
            ?? $stripe->products->create([
                'name' => 'GenTrack Technician',
                'description' => 'Access to the technician panel: receive maintenance requests, bid, and manage jobs.',
                'metadata' => ['gentrack_plan' => 'technician'],
            ]);

        $techMonthly = $this->findOrCreatePrice($stripe, $techProduct->id, 'month', (int) $this->option('tech-monthly'), $currency, 'gentrack_tech_monthly');
        $techYearly = $this->findOrCreatePrice($stripe, $techProduct->id, 'year', (int) $this->option('tech-yearly'), $currency, 'gentrack_tech_yearly');

        $this->newLine();
        $this->line('Product: '.$product->id.' (GenTrack Pro)');
        $this->line('Product: '.$techProduct->id.' (GenTrack Technician)');
        $this->newLine();
        $this->comment('Add these to your .env:');
        $this->line("STRIPE_PRICE_PRO_MONTHLY={$monthly}");
        $this->line("STRIPE_PRICE_PRO_YEARLY={$yearly}");
        $this->line("STRIPE_PRICE_TECH_MONTHLY={$techMonthly}");
        $this->line("STRIPE_PRICE_TECH_YEARLY={$techYearly}");

        return self::SUCCESS;
    }

    /**
     * Resolve the current price for a plan by its stable lookup key. Stripe
     * prices are immutable, so re-running with a *changed* amount cannot edit the
     * existing price — instead we create a new one, transfer the lookup key onto
     * it (so this key always resolves to the current amount), and archive the
     * old price. When the amount/currency already match, the existing price is
     * reused untouched, keeping re-runs idempotent.
     */
    private function findOrCreatePrice(StripeClient $stripe, string $productId, string $interval, int $amount, string $currency, string $lookupKey): string
    {
        $existing = $stripe->prices->all(['lookup_keys' => [$lookupKey], 'limit' => 1])->data[0] ?? null;

        if ($existing !== null && (int) $existing->unit_amount === $amount && strtolower((string) $existing->currency) === $currency) {
            $this->line("Reusing {$interval}ly price ({$lookupKey}): {$existing->id}");

            return $existing->id;
        }

        $price = $stripe->prices->create([
            'product' => $productId,
            'unit_amount' => $amount,
            'currency' => $currency,
            'recurring' => ['interval' => $interval],
            'lookup_key' => $lookupKey,
            'transfer_lookup_key' => true, // move the key off any stale price so it keeps resolving here
        ]);

        if ($existing !== null) {
            // Archive the old price so it stops showing as active. Existing
            // subscriptions on it keep billing at the old amount until changed.
            $stripe->prices->update($existing->id, ['active' => false]);
            $this->line("Replaced {$interval}ly price ({$lookupKey}): {$existing->id} ({$existing->unit_amount}) → {$price->id} ({$amount}).");
        } else {
            $this->line("Created {$interval}ly price ({$lookupKey}): {$price->id}");
        }

        return $price->id;
    }
}
