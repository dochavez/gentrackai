<?php

/*
|--------------------------------------------------------------------------
| Deep-link / app-association identity
|--------------------------------------------------------------------------
|
| Values used to serve the iOS Universal Links (apple-app-site-association)
| and Android App Links (assetlinks.json) files that let the mobile app claim
| https://<FRONTEND_URL>/reset-password links (see WellKnownController).
|
| Set these on the server .env once the native build's signing identity is
| known. Until they're set, the association files are served with empty
| details and link verification simply won't pass yet.
|
*/

return [

    // iOS: "<AppleTeamID>.<bundleId>". Set IOS_APP_ID in .env;
    // no default is committed. Override
    // via env if the Apple team / bundle id ever changes.
    'ios_app_id' => env('IOS_APP_ID', ''),

    // App paths the mobile app claims (emailed deep links). Keep in sync with
    // the Android intentFilters in the app's app.json.
    'paths' => [
        '/reset-password',
        '/reset-password*',
    ],

    // Android application id.
    'android_package' => env('ANDROID_PACKAGE', 'com.thotsuya.gentrackai'),

    // Android release signing cert SHA-256 fingerprint(s), comma-separated.
    // Get them from `eas credentials` (Android → keystore) or
    // `keytool -list -v -keystore <file>`. Include both the upload and Play
    // App Signing fingerprints when using Google Play App Signing.
    'android_sha256' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('ANDROID_SHA256_FINGERPRINTS', ''))
    ))),

];
