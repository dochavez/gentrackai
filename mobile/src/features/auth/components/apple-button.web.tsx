/**
 * Web stub. Sign in with Apple on the web needs a Services ID + redirect flow
 * the app doesn't use, and `expo-apple-authentication` has no web build — so
 * Metro picks this file and the button simply isn't offered.
 */

export function AppleButton(_: { onPress: () => void; loading?: boolean; disabled?: boolean }) {
  return null;
}
