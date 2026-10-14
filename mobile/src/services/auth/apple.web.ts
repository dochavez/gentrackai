/**
 * Web stub for the Apple Sign-In service. `expo-apple-authentication` is
 * iOS-only, so Metro picks this file on web to keep the bundle clean. The
 * button is never rendered there — `isAppleSignInAvailable()` returns false.
 */

import type { AppleCredential } from '@/services/auth/apple';

export type { AppleCredential };

export async function isAppleSignInAvailable(): Promise<boolean> {
  return false;
}

export async function signInWithApple(): Promise<AppleCredential | null> {
  throw new Error('Sign in with Apple is not available on web in this build.');
}
