import { Stack } from 'expo-router';

/** Unauthenticated flow (sign in / sign up / forgot password). */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
