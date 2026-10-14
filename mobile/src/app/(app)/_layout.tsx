import { Slot, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppTabBar, type AppTab } from '@/components/app-tab-bar';
import { Palette } from '@/constants/design';

/**
 * Authenticated app shell: renders the active tab screen with the custom bottom
 * tab bar overlaid. The active tab tracks the current route.
 */
export default function AppLayout() {
  const pathname = usePathname();
  const active: AppTab = pathname.startsWith('/fleet')
    ? 'fleet'
    : pathname.startsWith('/tasks')
      ? 'tasks'
      : pathname.startsWith('/insights')
        ? 'insights'
        : 'home';

  return (
    <View style={styles.root}>
      <Slot />
      <AppTabBar active={active} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
});
