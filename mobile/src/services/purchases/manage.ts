/**
 * Opens the platform's own subscription-management screen.
 *
 * A subscription bought with In-App Purchase can only be changed or cancelled by
 * the store that sold it, so the app links out instead of offering its own
 * cancel flow (Apple requires this link to exist for auto-renewable subs).
 */

import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const URLS: Record<string, string> = {
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
};

export async function openStoreSubscriptions(): Promise<void> {
  const url = URLS[Platform.OS];
  if (!url) return;

  await Linking.openURL(url);
}
