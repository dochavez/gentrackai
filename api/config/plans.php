<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Enforcement master switch
    |--------------------------------------------------------------------------
    |
    | When false, PlanGate treats every organization as unlimited (pre-monetization
    | behavior). Ship the billing plumbing to production with PLAN_ENFORCE=false so
    | existing users aren't suddenly gated, then flip to true at launch once the
    | upgrade path is live.
    |
    */

    'enforce' => env('PLAN_ENFORCE', true),

    /*
    |--------------------------------------------------------------------------
    | Stripe price IDs
    |--------------------------------------------------------------------------
    |
    | The Pro plan's Stripe Price IDs (create the Product + Prices in the Stripe
    | Dashboard, then paste their IDs here via env). `checkout` uses these to
    | start a subscription; `keyForPrice()` maps a webhook's price back to a plan.
    |
    */

    'prices' => [
        'pro_monthly' => env('STRIPE_PRICE_PRO_MONTHLY'),
        'pro_yearly' => env('STRIPE_PRICE_PRO_YEARLY'),
        // Technician panel subscription (a separate Cashier subscription type
        // 'technician' on the provider org — see config('plans.technician')).
        'technician_monthly' => env('STRIPE_PRICE_TECH_MONTHLY'),
        'technician_yearly' => env('STRIPE_PRICE_TECH_YEARLY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | In-App Purchase entitlements (RevenueCat)
    |--------------------------------------------------------------------------
    |
    | iOS must sell digital subscriptions with In-App Purchase (App Store
    | guideline 3.1.1), so those purchases never reach Cashier. RevenueCat wraps
    | StoreKit and reports what the customer owns as named "entitlements"; this
    | maps each one onto the subscription type it grants, so a store purchase
    | unlocks exactly what the equivalent Stripe subscription does.
    |
    | Create these entitlement ids in the RevenueCat dashboard and attach the
    | App Store products to them.
    |
    | Store products are priced ABOVE the Stripe prices below to absorb Apple's
    | and Google's commission, so a store sale nets roughly what a web sale does
    | (15% under the App Store Small Business Program / Play's reduced rate):
    |
    |   pro.monthly      $17.99  -> nets ~$15.29   (web $14.99)
    |   pro.yearly      $179.99  -> nets ~$152.99  (web $149.99)
    |   technician.monthly $11.99 -> nets ~$10.19  (web $9.99)
    |   technician.yearly $119.99 -> nets ~$101.99 (web $99.99)
    |
    | These figures live here for the record only -- the app must display the
    | store's own localized price from `getOfferings()`, never a label we own, so
    | changing a price is an App Store Connect / Play Console change, not a
    | deploy. Keep the product ids below in sync with those consoles.
    |
    */

    'iap' => [
        'entitlements' => [
            'default' => env('RC_ENTITLEMENT_PRO', 'pro'),
            'technician' => env('RC_ENTITLEMENT_TECHNICIAN', 'technician_pro'),
        ],

        // Store product ids attached to the entitlements above. Informational:
        // the app buys whatever the RevenueCat offering serves, and the webhook
        // reports the product id it actually charged.
        'products' => [
            'pro_monthly' => env('IAP_PRODUCT_PRO_MONTHLY', 'com.thotsuya.gentrackai.pro.monthly'),
            'pro_yearly' => env('IAP_PRODUCT_PRO_YEARLY', 'com.thotsuya.gentrackai.pro.yearly'),
            'technician_monthly' => env('IAP_PRODUCT_TECH_MONTHLY', 'com.thotsuya.gentrackai.technician.monthly'),
            'technician_yearly' => env('IAP_PRODUCT_TECH_YEARLY', 'com.thotsuya.gentrackai.technician.yearly'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Display pricing
    |--------------------------------------------------------------------------
    |
    | Human-readable price labels for the *Stripe* (web) prices, shown on the
    | upgrade screen only where Stripe is the payment channel. On iOS and Android
    | the app shows the store's localized price instead (see the IAP block above),
    | so these labels must never be rendered on a native paywall. Keep them in
    | sync with the actual Stripe Prices referenced above.
    |
    */

    'pricing' => [
        'monthly_label' => env('PLAN_PRO_MONTHLY_LABEL', '$14.99'),
        'yearly_label' => env('PLAN_PRO_YEARLY_LABEL', '$149.99'),
        'yearly_note' => env('PLAN_PRO_YEARLY_NOTE', 'Save ~17% billed yearly'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Plan limits
    |--------------------------------------------------------------------------
    |
    | Per-organization entitlements. `null` means unlimited. Free is the default
    | for any org without an active subscription; Pro is unlocked by a live
    | Stripe subscription. Tunable via env without code changes.
    |
    */

    'free' => [
        'generators' => env('PLAN_FREE_GENERATORS', 3) === null ? null : (int) env('PLAN_FREE_GENERATORS', 3),
        'members' => env('PLAN_FREE_MEMBERS', 2) === null ? null : (int) env('PLAN_FREE_MEMBERS', 2),
        'insights' => false, // AI insights are Pro-only
        'chat_daily' => env('PLAN_FREE_CHAT_DAILY', 5) === null ? null : (int) env('PLAN_FREE_CHAT_DAILY', 5),
    ],

    'pro' => [
        'generators' => null, // unlimited
        'members' => null,    // unlimited
        'insights' => true,
        'chat_daily' => null, // unlimited
    ],

    /*
    |--------------------------------------------------------------------------
    | Technician panel plan
    |--------------------------------------------------------------------------
    |
    | A separate subscription (Cashier type 'technician') billed to the provider
    | org for access to the technician panel: $9.99/mo or $99.99/yr. The free
    | trial is USAGE-based — the first `free_trial_jobs` completed jobs are free;
    | after that an active subscription is required to win more work. A payment
    | method is captured up front (setup-mode Checkout) to enable the trial.
    |
    */

    'technician' => [
        'free_trial_jobs' => (int) env('TECH_FREE_TRIAL_JOBS', 1),
        // Require a card on file before a provider can take any work. Off by
        // default: on iOS the subscription is an In-App Purchase, and capturing
        // a card through Stripe Checkout is the very thing App Store guideline
        // 3.1.1 forbids — see TechnicianGate.
        'require_payment_method' => (bool) env('TECH_REQUIRE_PAYMENT_METHOD', false),
        'pricing' => [
            'monthly_label' => env('TECH_MONTHLY_LABEL', '$9.99'),
            'yearly_label' => env('TECH_YEARLY_LABEL', '$99.99'),
            'yearly_note' => env('TECH_YEARLY_NOTE', 'Save ~17% billed yearly'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Checkout / portal redirects
    |--------------------------------------------------------------------------
    |
    | After Checkout or the billing portal, Stripe returns the customer to the
    | `billing.return` web route (see routes/web.php + BillingReturnController),
    | which bounces the in-app browser back into the mobile app via its deep
    | link. The app passes its own return URL per-request, so there is nothing
    | to configure here — these URLs are built from the route, not env.
    |
    */

];
