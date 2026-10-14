import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';

/** A centered label flanked by hairlines (e.g. "or continue with"). */
export function LabeledDivider({ children }: { children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.label}>{children}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 6,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.hairline,
  },
  label: {
    fontFamily: Font.semibold,
    fontSize: 12.5,
    color: Palette.textFaint,
  },
});
