/**
 * Composes the app-wide providers: the Redux store (client auth state), SWR
 * (data fetching via the axios client), and React Native Paper (theming +
 * Material/utility UI). Mounted once at the root in `src/app/_layout.tsx`.
 *
 * Also the single place the session-scoped side effects are kicked off: the
 * launch session restore, and the RevenueCat store identity that has to track
 * the active organization for In-App Purchases.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { SWRConfig } from 'swr';

import { paperDarkTheme, paperLightTheme } from '@/constants/paper-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useStoreBillingIdentity } from '@/hooks/use-store-billing-identity';
import { api } from '@/services/api/client';
import { store } from '@/store';
import { restoreSession } from '@/store/auth-slice';
import { useAppDispatch } from '@/store/hooks';

/**
 * Paper resolves its icons through `react-native-vector-icons` by default,
 * which Expo doesn't ship. Route icon rendering through `@expo/vector-icons`.
 */
const paperSettings = {
  icon: ({ name, color, size }: { name: string; color?: string; size?: number }) => (
    <MaterialCommunityIcons
      name={name as keyof typeof MaterialCommunityIcons.glyphMap}
      color={color}
      size={size}
    />
  ),
};

const swrConfig = {
  fetcher: (url: string) => api.get(url).then((r) => r.data),
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};

/**
 * Kicks off the launch session restore once the store is mounted, and keeps the
 * store-billing identity in step with the session it produces.
 */
function SessionRestorer({ children }: PropsWithChildren) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);
  useStoreBillingIdentity();
  return <>{children}</>;
}

export function AppProviders({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? paperDarkTheme : paperLightTheme;

  return (
    <Provider store={store}>
      <SessionRestorer>
        <SWRConfig value={swrConfig}>
          <PaperProvider theme={theme} settings={paperSettings}>
            {children}
          </PaperProvider>
        </SWRConfig>
      </SessionRestorer>
    </Provider>
  );
}
