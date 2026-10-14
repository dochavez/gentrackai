import { Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Palette } from '@/constants/design';
import { navigationDarkTheme, navigationLightTheme } from '@/constants/paper-theme';
import { useAuth } from '@/hooks/use-auth';
import { useAppFonts } from '@/hooks/use-app-fonts';
import { AppProviders } from '@/providers/app-providers';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AppProviders>
      <ThemeProvider value={colorScheme === 'dark' ? navigationDarkTheme : navigationLightTheme}>
        <RootNavigator />
        <AnimatedSplashOverlay />
      </ThemeProvider>
    </AppProviders>
  );
}

/** Renders the stack and redirects between the auth flow and the app based on session state. */
function RootNavigator() {
  const { user, isSignedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onVerify = segments[0] === 'verify-email';
    // Email/password signups must verify before using the app (social is trusted).
    const needsVerify = isSignedIn && user != null && !user.emailVerified;

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (needsVerify && !onVerify) {
      router.replace('/verify-email');
    } else if (isSignedIn && !needsVerify && (inAuthGroup || onVerify)) {
      router.replace('/');
    }
  }, [user, isSignedIn, isLoading, segments, router]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: Palette.cream }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="generators/[id]" />
      <Stack.Screen name="account" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
      <Stack.Screen name="new-task" options={{ presentation: 'modal' }} />
      <Stack.Screen name="log-reading" options={{ presentation: 'modal' }} />
      <Stack.Screen name="edit-generator" options={{ presentation: 'modal' }} />
      <Stack.Screen name="maintenance-report" options={{ presentation: 'modal' }} />
      <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
      <Stack.Screen name="team" options={{ presentation: 'modal' }} />
      <Stack.Screen name="invite" options={{ presentation: 'modal' }} />
      <Stack.Screen name="upgrade" options={{ presentation: 'modal' }} />
      <Stack.Screen name="maintenance/[generatorId]" />
      {/* Maintenance marketplace (customer) */}
      <Stack.Screen name="request-maintenance" options={{ presentation: 'modal' }} />
      <Stack.Screen name="maintenance-requests/index" />
      <Stack.Screen name="maintenance-requests/[id]" />
      <Stack.Screen name="providers/[organizationId]" />
      {/* Technician panel */}
      <Stack.Screen name="technician" />
      <Stack.Screen name="technician-onboarding" options={{ presentation: 'modal' }} />
      <Stack.Screen name="technician-billing" options={{ presentation: 'modal' }} />
      <Stack.Screen name="technician-profile-edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="submit-offer" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
