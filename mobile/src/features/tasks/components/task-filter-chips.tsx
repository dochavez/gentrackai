import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Font, Palette } from '@/constants/design';
import { FILTERS } from '@/features/tasks/constants';
import type { TaskCounts, TaskFilter } from '@/features/tasks/types';

/** Horizontal filter chips for the tasks list, with per-filter counts. */
export function TaskFilterChips({
  active,
  counts,
  onSelect,
}: {
  active: TaskFilter;
  counts: TaskCounts;
  onSelect: (filter: TaskFilter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}>
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        const count = counts[f.key];
        return (
          <Pressable
            key={f.key}
            onPress={() => onSelect(f.key)}
            style={[styles.chip, isActive && styles.chipActive]}>
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
            {count > 0 ? (
              <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>{count}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 8, paddingTop: 14, paddingRight: 20 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.hairline,
  },
  chipActive: { backgroundColor: Palette.ink, borderColor: Palette.ink },
  chipText: { fontFamily: Font.semibold, fontSize: 12.5, color: Palette.textStrong },
  chipTextActive: { fontFamily: Font.bold, color: Palette.white },
  chipCount: { fontFamily: Font.bold, fontSize: 11.5, color: Palette.goldText },
  chipCountActive: { color: Palette.gold },
});
