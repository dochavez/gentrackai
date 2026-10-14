import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { Font, Palette } from '@/constants/design';
import type { WeeklyRunHours } from '@/features/insights/types';

/** Weekly run-hours bar chart with a trend label and the 30-day forecast. */
export function RunHoursChart({
  bars,
  trendLabel,
  forecastLabel,
}: {
  bars: WeeklyRunHours[];
  trendLabel: string;
  forecastLabel: string;
}) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const trendColor = trendLabel.startsWith('↑')
    ? Palette.green
    : trendLabel.startsWith('↓')
      ? Palette.red
      : Palette.textMuted;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Run hours / week</Text>
        <Text style={[styles.trend, { color: trendColor }]}>{trendLabel}</Text>
      </View>

      <View style={styles.bars}>
        {bars.map((b) => (
          <View key={b.label} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { height: `${(b.value / max) * 100}%` }]} />
            </View>
            <Text style={styles.barLabel}>{b.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.forecast}>
        <BoltIcon size={13} color={Palette.goldText} />
        <Text style={styles.forecastText}>{forecastLabel} · next 30 days</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  trend: { fontFamily: Font.bold, fontSize: 13 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 108, marginTop: 16 },
  barCol: { flex: 1, alignItems: 'center', gap: 8 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill: { width: '100%', minHeight: 4, borderRadius: 8, backgroundColor: Palette.gold },
  barLabel: { fontFamily: Font.semibold, fontSize: 11, color: Palette.textMuted },
  forecast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Palette.hairline,
  },
  forecastText: { fontFamily: Font.semibold, fontSize: 12.5, color: Palette.textStrong },
});
