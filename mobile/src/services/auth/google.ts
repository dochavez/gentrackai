/**
 * Thin wrapper around `@react-native-google-signin/google-signin`.
 *
 * Requires a development build (this package has native code and cannot run in
 * Expo Go). Configure your client IDs in `.env` (see `.env.example`).
 */

import {
  GoogleSignin,
  isSuccessResponse,
  type User,
} from '@react-native-google-signin/google-signin';

import { assertGoogleConfig, env } from '@/config/env';

let configured = false;

/** Configures the native SDK. Safe to call multiple times; only runs once. */
export function configureGoogleSignIn(): void {
  if (configured) return;
  assertGoogleConfig();
  GoogleSignin.configure({
    webClientId: env.google.webClientId,
    iosClientId: env.google.iosClientId,
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
  configured = true;
}

/**
 * Opens the native Google Sign-In flow.
 * @returns the signed-in `User`, or `null` if the user cancelled.
 * @throws if Play Services are unavailable or the sign-in genuinely fails.
 */
export async function signInWithGoogle(): Promise<User | null> {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  return isSuccessResponse(response) ? response.data : null;
}

/** Restores the previously signed-in user without any UI, if a session exists. */
export async function restoreGoogleSession(): Promise<User | null> {
  configureGoogleSignIn();
  const response = await GoogleSignin.signInSilently();
  return response.type === 'success' ? response.data : null;
}

/** Signs the current user out of Google. */
export async function signOutFromGoogle(): Promise<void> {
  await GoogleSignin.signOut();
}
