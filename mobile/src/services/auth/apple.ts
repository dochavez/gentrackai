/**
 * Thin wrapper around `expo-apple-authentication` (native "Sign in with Apple").
 *
 * Offering this alongside Google is required by App Store guideline 4.8. The
 * flow is iOS-only: `isAppleSignInAvailable()` gates the button so Android/web
 * never render it. Requires a development build (`ios.usesAppleSignIn`).
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

/** What the backend needs from a completed Apple authorization. */
export type AppleCredential = {
  /** JWT signed by Apple; verified server-side against Apple's JWKS. */
  identityToken: string;
  /**
   * One-time code the backend exchanges for a refresh token, so it can revoke
   * the Apple grant when the account is deleted (guideline 5.1.1(v)).
   */
  authorizationCode: string | null;
  /** Only ever present on the *first* authorization; null on every later one. */
  name: string | null;
};

/** Apple's cancel error carries this code; treated as "no credential", not a failure. */
const CANCELED = 'ERR_REQUEST_CANCELED';

/** True only on iOS devices/simulators that support Sign in with Apple. */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

/**
 * Opens the native Sign in with Apple sheet.
 * @returns the credential, or `null` if the user cancelled.
 * @throws if the authorization genuinely fails.
 */
export async function signInWithApple(): Promise<AppleCredential | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token.');
    }

    return {
      identityToken: credential.identityToken,
      authorizationCode: credential.authorizationCode ?? null,
      name: formatFullName(credential.fullName),
    };
  } catch (e) {
    if (isCancellation(e)) return null;
    throw e;
  }
}

function isCancellation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === CANCELED;
}

/**
 * Apple hands back the name in parts, and only once — the backend stores it at
 * account creation and owns every display string from then on, so this is the
 * one place the app assembles it.
 */
function formatFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | null {
  if (!fullName) return null;
  const name = [fullName.givenName, fullName.familyName].filter(Boolean).join(' ').trim();
  return name || null;
}
