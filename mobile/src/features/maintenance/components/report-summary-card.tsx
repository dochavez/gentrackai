import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import { ReportStat } from '@/features/maintenance/components/report-stat';
import type { ReportSummary } from '@/features/maintenance/types';

/** Dark summary card: services / total paid / est. saved for the period. */
export function ReportSummaryCard({
  periodLabel,
  summary,
}: {
  periodLabel: string;
  summary: ReportSummary;
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryHead}>Summary · {periodLabel}</Text>
      <View style={styles.summaryRow}>
        <ReportStat value={String(summary.services)} label="Services" color={Palette.white} />
        <ReportStat value={summary.totalPaidLabel} label="Total paid" color={Palette.gold} />
        <ReportStat value={summary.estSavedLabel} label="Est. saved" color={Palette.green} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { backgroundColor: Palette.ink, borderRadius: 18, padding: 20 },
  summaryHead: { fontFamily: Font.semibold, fontSize: 12, color: 'rgba(247,242,232,0.6)', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', gap: 12 },
});
