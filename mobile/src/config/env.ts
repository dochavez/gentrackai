/**
 * Public runtime configuration.
 *
 * Values come from `EXPO_PUBLIC_*` environment variables (see `.env.example`).
 * These are inlined into the client bundle at build time, so only reference
 * values here that are safe to ship publicly (OAuth *client* IDs are; secrets are not).
 */

export const env = {
  api: {
    /** Backend base URL. The client appends `/api`. Override with EXPO_PUBLIC_API_URL. */
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.gentrackai.com',
  },
  google: {
    /** OAuth 2.0 Web client ID. Required to receive an `idToken`. */
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    /** OAuth 2.0 iOS client ID. Optional when `iosUrlScheme` / GoogleService-Info.plist is set. */
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  },
  revenueCat: {
    /**
     * RevenueCat *public* SDK keys (one per store app), which front StoreKit and
     * Play Billing. Public keys are designed to ship in the client; the secret
     * key belongs to the backend only.
     */
    iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
    androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
  },
  legal: {
    /**
     * Apple requires a paywall for auto-renewable subscriptions to link to the
     * Terms of Use (EULA) and Privacy Policy. Links are hidden while unset, so
     * an unconfigured build never shows a dead link.
     */
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL ?? '',
    privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL ?? '',
  },
} as const;

/**
 * Fails fast when Google Sign-In is not configured.
 *
 * Without a Web client ID, Android sign-in completes but returns no `idToken`,
 * which otherwise surfaces as a misleading "Google did not return an ID token".
 * Note `.env` is gitignored and NOT uploaded to EAS — EAS builds get these from
 * `eas.json` (`build.<profile>.env`) or an EAS environment variable.
 */
export function assertGoogleConfig(): void {
  if (!env.google.webClientId) {
    throw new Error(
      'Google Sign-In is not configured: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is empty. ' +
        'Local runs read it from .env; EAS builds need it in eas.json or as an EAS ' +
        'environment variable (.env is gitignored and not uploaded to EAS).'
    );
  }
}
