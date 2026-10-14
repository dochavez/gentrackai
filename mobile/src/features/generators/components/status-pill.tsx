import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/design';
import { statusDisplay } from '@/features/generators/status';
import type { GeneratorStatus } from '@/features/generators/types';

export function StatusPill({ status }: { status: GeneratorStatus }) {
  const s = statusDisplay(status);
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <View style={[styles.dot, { backgroundColor: s.dot }]} />
      <Text style={[styles.label, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  label: {
    fontFamily: Font.extrabold,
    fontSize: 11.5,
    letterSpacing: 0.3,
  },
});
