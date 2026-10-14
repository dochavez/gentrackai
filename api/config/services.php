<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Google Sign-In
    |--------------------------------------------------------------------------
    |
    | The mobile/web client performs the native Google flow and sends us the
    | resulting ID token. We verify that token against these OAuth client IDs
    | (the token's `aud` claim must match one of them). The "web" client ID is
    | the primary audience because @react-native-google-signin is configured
    | with `webClientId`; the iOS client ID is accepted as a fallback.
    |
    */

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'ios_client_id' => env('GOOGLE_IOS_CLIENT_ID'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sign in with Apple
    |--------------------------------------------------------------------------
    |
    | The app runs the native Sign in with Apple flow and sends us the resulting
    | identity token. We verify its signature against Apple's JWKS and require
    | the `aud` claim to match one of our bundle identifiers (App Store
    | guideline 4.8 requires offering this alongside Google Sign-In).
    |
    | `team_id` / `key_id` / `private_key` authenticate us to Apple's OAuth
    | endpoints, which is how we revoke a user's Apple grant when they delete
    | their account (guideline 5.1.1(v)). `client_id` is the bundle identifier
    | the app authorized against; it defaults to the first accepted bundle id.
    | Leave the key blank and revocation is skipped — sign-in still works.
    |
    */

    'apple' => [
        'bundle_ids' => array_filter(explode(',', (string) env('APPLE_BUNDLE_IDS', 'com.thotsuya.gentrackai'))),
        'client_id' => env('APPLE_CLIENT_ID'),
        'team_id' => env('APPLE_TEAM_ID'),
        'key_id' => env('APPLE_KEY_ID'),
        // Either the .p8 contents (escaped newlines) or a path to the key file.
        'private_key' => env('APPLE_PRIVATE_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | RevenueCat (In-App Purchases)
    |--------------------------------------------------------------------------
    |
    | `secret_key` is the RevenueCat *secret* API key (server-side only — the app
    | uses the public SDK key), used to read a subscriber's entitlements right
    | after a purchase. `webhook_secret` is the exact Authorization header value
    | configured on the RevenueCat webhook; RevenueCat does not sign payloads, so
    | that shared secret is what authenticates the callback.
    |
    */

    'revenuecat' => [
        'secret_key' => env('REVENUECAT_SECRET_KEY'),
        'webhook_secret' => env('REVENUECAT_WEBHOOK_SECRET'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Gemini (Google Generative Language)
    |--------------------------------------------------------------------------
    |
    | Used via Prism to read generator nameplates from photos. The API key is
    | read by Prism from GEMINI_API_KEY (see config/prism.php); the model is
    | selected here.
    |
    */

    'gemini' => [
        // `gemini-flash-latest` tracks the current free-tier flash model.
        // Pinned versions like gemini-2.0-flash have a 0 free-tier quota / get deprecated.
        'model' => env('GEMINI_MODEL', 'gemini-flash-latest'),
        // Model used for nameplate OCR/vision. Bump to a stronger model
        // (e.g. gemini-2.5-pro) if flash struggles with tough labels.
        'vision_model' => env('GEMINI_VISION_MODEL', env('GEMINI_MODEL', 'gemini-flash-latest')),
    ],

];
