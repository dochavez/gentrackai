import { useRouter } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FleetIcon } from '@/components/ui/icons/fleet-icon';
import { HomeIcon } from '@/components/ui/icons/home-icon';
import { InsightsIcon } from '@/components/ui/icons/insights-icon';
import { ScanIcon } from '@/components/ui/icons/scan-icon';
import { TasksIcon } from '@/components/ui/icons/tasks-icon';
import { Font, Layout, Palette } from '@/constants/design';

export type AppTab = 'home' | 'fleet' | 'tasks' | 'insights';

function TabItem({
  label,
  color,
  onPress,
  children,
}: {
  label: string;
  color: string;
  onPress?: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.item}>
      {children}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Custom bottom tab bar with a centered scan action. Home / Fleet / Scan
 * navigate; Tasks / Insights are inert until those screens exist.
 */
export function AppTabBar({ active = 'home' }: { active?: AppTab }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const tint = (tab: AppTab) => (active === tab ? Palette.ink : Palette.tabInactive);

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.bar}>
        <TabItem label="Home" color={tint('home')} onPress={() => router.navigate('/')}>
          <HomeIcon color={tint('home')} />
        </TabItem>
        <TabItem label="Fleet" color={tint('fleet')} onPress={() => router.navigate('/fleet')}>
          <FleetIcon color={tint('fleet')} />
        </TabItem>

        <Pressable
          style={styles.centerSlot}
          onPress={() => router.push('/scan')}
          accessibilityLabel="Scan a generator">
          <View style={styles.fab}>
            <ScanIcon size={26} color={Palette.ink} />
          </View>
        </Pressable>

        <TabItem label="Tasks" color={tint('tasks')} onPress={() => router.navigate('/tasks')}>
          <TasksIcon color={tint('tasks')} />
        </TabItem>
        <TabItem label="Insights" color={tint('insights')} onPress={() => router.navigate('/insights')}>
          <InsightsIcon color={tint('insights')} />
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
    // Center the bar within a max width so tabs don't spread across a tablet.
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
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 10,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 16,
    marginTop: -22,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.gold,
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
