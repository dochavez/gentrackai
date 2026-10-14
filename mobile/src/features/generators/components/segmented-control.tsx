import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';

type SegmentedControlProps<T extends string> = {
  options: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
  /** Label font size — the two screens differ slightly (12.5 vs 13). */
  size?: number;
};

/** A row of mutually-exclusive pill options (active = ink). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 13,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const isActive = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={[styles.segmentItem, isActive && styles.segmentItemActive]}>
            <Text style={[styles.segmentText, { fontSize: size }, isActive && styles.segmentTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segmentItemActive: { backgroundColor: Palette.ink },
  segmentText: { fontFamily: Font.semibold, color: Palette.textStrong },
  segmentTextActive: { fontFamily: Font.bold, color: Palette.white },
});
