import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import { DUE_OPTIONS } from '@/features/tasks/constants';

/** Quick due-date presets; tapping the active preset clears it. */
export function DueChips({
  value,
  onSelect,
}: {
  value: number | null;
  onSelect: (days: number) => void;
}) {
  return (
    <View>
      <Text style={styles.groupLabel}>Due</Text>
      <View style={styles.chips}>
        {DUE_OPTIONS.map((opt) => {
          const active = value === opt.days;
          return (
            <Text
              key={opt.days}
              accessibilityRole="button"
              onPress={() => onSelect(opt.days)}
              style={[styles.chip, active && styles.chipActive]}>
              {opt.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupLabel: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: Palette.textStrong,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: Palette.ink, color: Palette.white, borderColor: Palette.ink },
});
