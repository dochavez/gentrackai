<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

/**
 * Serves the `/.well-known/*` app-association files that let the mobile app
 * claim reset-password links via iOS Universal Links and Android App Links.
 *
 * These must be reachable over HTTPS with a JSON content type and no redirect,
 * at the domain configured as FRONTEND_URL (where the reset link points).
 */
class WellKnownController extends Controller
{
    /**
     * iOS Universal Links: /.well-known/apple-app-site-association
     *
     * `appID` is "<AppleTeamID>.<bundleId>". Only the paths in
     * config('deeplink.paths') are claimed so the rest of the API domain is
     * untouched.
     */
    public function appleAppSiteAssociation(): JsonResponse
    {
        $appId = config('deeplink.ios_app_id');

        $details = $appId
            ? [[
                'appID' => $appId,
                'paths' => config('deeplink.paths', []),
            ]]
            : [];

        return response()->json([
            'applinks' => [
                'apps' => [],
                'details' => $details,
            ],
        ]);
    }

    /**
     * Android App Links: /.well-known/assetlinks.json
     */
    public function assetLinks(): JsonResponse
    {
        $fingerprints = config('deeplink.android_sha256', []);

        if (empty($fingerprints)) {
            return response()->json([]);
        }

        return response()->json([[
            'relation' => ['delegate_permission/common.handle_all_urls'],
            'target' => [
                'namespace' => 'android_app',
                'package_name' => config('deeplink.android_package'),
                'sha256_cert_fingerprints' => $fingerprints,
            ],
        ]]);
    }
}
