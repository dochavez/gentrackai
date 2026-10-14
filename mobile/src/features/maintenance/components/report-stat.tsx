import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/design';

/** A single labeled figure inside the report summary card (value color varies). */
export function ReportStat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1 },
  statValue: { fontFamily: Font.displayExtra, fontSize: 26 },
  statLabel: { marginTop: 2, fontFamily: Font.semibold, fontSize: 11, color: 'rgba(247,242,232,0.6)' },
});
