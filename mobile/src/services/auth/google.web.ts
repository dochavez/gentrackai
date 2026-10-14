/**
 * Web stub for the Google Sign-In service. The native package has no web build,
 * so Metro picks this file on web (`google.web.ts`) to keep the bundle clean.
 * The `type` import is erased at compile time — no native module is pulled in.
 */

import { type User } from '@react-native-google-signin/google-signin';

export function configureGoogleSignIn(): void {}

export async function signInWithGoogle(): Promise<User | null> {
  throw new Error('Google Sign-In is not available on web in this build.');
}

export async function restoreGoogleSession(): Promise<User | null> {
  return null;
}

export async function signOutFromGoogle(): Promise<void> {}
