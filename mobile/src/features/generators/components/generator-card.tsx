import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { FleetIcon } from '@/components/ui/icons/fleet-icon';
import { Font, Palette } from '@/constants/design';
import { StatusPill } from '@/features/generators/components/status-pill';
import { statusDisplay } from '@/features/generators/status';
import type { Generator } from '@/features/generators/types';

export function GeneratorCard({ generator, onPress }: { generator: Generator; onPress: () => void }) {
  const s = statusDisplay(generator.status);
  const spec =
    [generator.ratedPower, generator.type].filter(Boolean).join(' · ') || generator.manufacturer || '—';

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={[styles.thumb, { backgroundColor: s.ok ? Palette.greenBg : Palette.redBg }]}>
          <FleetIcon size={30} color={s.ok ? Palette.green : Palette.alert} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.name}>
              {generator.name}
            </Text>
            <StatusPill status={generator.status} />
          </View>
          <Text numberOfLines={1} style={styles.spec}>
            {spec}
          </Text>
          <Text style={styles.meta}>{generator.runHours} run hrs</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    fontFamily: Font.bold,
    fontSize: 16,
    color: Palette.ink,
  },
  spec: {
    marginTop: 2,
    fontFamily: Font.regular,
    fontSize: 13,
    color: Palette.textMuted,
  },
  meta: {
    marginTop: 6,
    fontFamily: Font.semibold,
    fontSize: 12,
    color: Palette.textFaint,
  },
});
