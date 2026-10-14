import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarIcon } from '@/components/ui/icons/calendar-icon';
import { UsersIcon } from '@/components/ui/icons/users-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { Font, Layout, Palette } from '@/constants/design';

export type TechnicianTab = 'requests' | 'jobs' | 'profile';

function TabItem({
  label,
  color,
  onPress,
  children,
}: {
  label: string;
  color: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={styles.item}>
      {children}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom tab bar for the technician panel — Requests / My jobs / Profile. */
export function TechnicianTabBar({ active }: { active: TechnicianTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tint = (tab: TechnicianTab) => (active === tab ? Palette.ink : Palette.tabInactive);

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.bar}>
        <TabItem label="Requests" color={tint('requests')} onPress={() => router.navigate('/technician/requests')}>
          <WrenchIcon size={22} color={tint('requests')} />
        </TabItem>
        <TabItem label="My jobs" color={tint('jobs')} onPress={() => router.navigate('/technician/jobs')}>
          <CalendarIcon size={22} color={tint('jobs')} />
        </TabItem>
        <TabItem label="Profile" color={tint('profile')} onPress={() => router.navigate('/technician/profile')}>
          <UsersIcon size={22} color={tint('profile')} />
        </TabItem>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    paddingTop: 8,
    paddingHorizontal: 18,
    experimental_backgroundImage: `linear-gradient(0deg, ${Palette.cream} 62%, rgba(247,242,232,0))`,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    alignSelf: 'center',
    backgroundColor: Palette.white,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: Palette.ink,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: Font.bold, fontSize: 10 },
});
