<?php

namespace App\Providers;

use App\Listeners\HandleStripeWebhook;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookReceived;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Bill per organization (the Organization is the Stripe customer).
        Cashier::useCustomerModel(config('cashier.model'));

        // Unlock the technician panel once its up-front payment method is captured.
        Event::listen(WebhookReceived::class, HandleStripeWebhook::class);

        // Rate limiter for the public auth endpoints (login/register/reset/etc.).
        // Keyed by email + IP so a shared IP doesn't lock everyone out, while a
        // single account/IP still can't be hammered.
        RateLimiter::for('auth', function (Request $request) {
            $key = Str::lower((string) $request->input('email')).'|'.$request->ip();

            return [
                Limit::perMinute(10)->by($key),
                Limit::perMinute(30)->by($request->ip()),
            ];
        });
    }
}
