import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';

/** Section title with an optional right-aligned action link (e.g. "See all"). */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? (
        <Text accessibilityRole="button" style={styles.action} onPress={onAction}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Font.displayBold,
    fontSize: 16,
    color: Palette.ink,
  },
  action: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: Palette.goldText,
  },
});
