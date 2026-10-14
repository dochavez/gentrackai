import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';

export type SpecItem = { label: string; value: string };

/** A card of label/value spec rows (shared by the detail screen and scan results). */
export function SpecList({ items }: { items: SpecItem[] }) {
  return (
    <Card style={styles.card}>
      {items.map((item, i) => (
        <View key={item.label} style={[styles.row, i < items.length - 1 && styles.divider]}>
          <Text style={styles.key}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  key: {
    fontFamily: Font.regular,
    fontSize: 13.5,
    color: Palette.textMuted,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
    fontFamily: Font.bold,
    fontSize: 13.5,
    color: Palette.ink,
  },
});
