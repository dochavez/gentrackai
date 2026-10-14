import { Slot, useRouter, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { TechnicianTabBar, type TechnicianTab } from '@/components/technician-tab-bar';
import { Palette } from '@/constants/design';
import { useAuth } from '@/hooks/use-auth';

/**
 * Technician panel shell: the active tab screen with the technician tab bar
 * overlaid. Guards the segment — a user whose active org isn't a provider (e.g.
 * after switching orgs, or before onboarding) is redirected to onboarding.
 */
export default function TechnicianLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (user && !user.isTechnician) {
      router.replace('/technician-onboarding');
    }
  }, [user, router]);

  const active: TechnicianTab = pathname.startsWith('/technician/jobs')
    ? 'jobs'
    : pathname.startsWith('/technician/profile')
      ? 'profile'
      : 'requests';

  return (
    <View style={styles.root}>
      <Slot />
      <TechnicianTabBar active={active} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
});
