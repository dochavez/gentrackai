import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';

export type FleetStat = {
  value: string;
  suffix?: string;
  label: string;
  color: string;
};

function StatCard({ value, suffix, label, color }: FleetStat) {
  return (
    <Card style={styles.card}>
      <Text style={[styles.value, { color }]}>
        {value}
        {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </Card>
  );
}

/** The three at-a-glance fleet metrics. */
export function FleetStats({ stats }: { stats: FleetStat[] }) {
  return (
    <View style={styles.row}>
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    flex: 1,
    padding: 14,
  },
  value: {
    fontFamily: Font.displayExtra,
    fontSize: 26,
  },
  suffix: {
    fontFamily: Font.displayExtra,
    fontSize: 15,
  },
  label: {
    marginTop: 1,
    fontFamily: Font.semibold,
    fontSize: 11.5,
    color: Palette.textMuted,
  },
});
