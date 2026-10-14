/**
 * Maintenance report — fleet-wide completed services with cost paid and
 * estimated savings over a selectable period. Reached from the Tasks "Report"
 * button. Sharing downloads the backend-generated PDF and opens the share
 * sheet (WhatsApp / Mail) on native, or downloads it on web. Period + share
 * state live in `useReportScreen`; this component just composes.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { ReportIcon } from '@/components/ui/icons/report-icon';
import { Font, Palette } from '@/constants/design';
import { ReportSummaryCard } from '@/features/maintenance/components/report-summary-card';
import { ServiceRow } from '@/features/maintenance/components/service-row';
import { PERIODS } from '@/features/maintenance/constants';
import { useReportScreen } from '@/features/maintenance/hooks/use-report-screen';

export function MaintenanceReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { period, setPeriod, report, isLoading, sharing, shareError, share } = useReportScreen();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Maintenance report</Text>
          <Text style={styles.subtitle}>Full fleet · {report?.periodLabel ?? '—'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading && !report ? (
          <ActivityIndicator color={Palette.gold} style={styles.loading} />
        ) : report ? (
          <>
            <ReportSummaryCard periodLabel={report.periodLabel} summary={report.summary} />

            <Text style={styles.section}>Services performed</Text>
            {report.services.length > 0 ? (
              <Card style={styles.list}>
                {report.services.map((s, i) => (
                  <ServiceRow key={s.id} service={s} first={i === 0} />
                ))}
              </Card>
            ) : (
              <Text style={styles.empty}>No services recorded in this period.</Text>
            )}

            <Text style={styles.section}>Share this report</Text>
            <View style={styles.shareRow}>
              <Pressable
                onPress={share}
                disabled={sharing}
                style={[styles.shareBtn, styles.whatsapp, sharing && styles.dimmed]}>
                <Text style={styles.whatsappText}>WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={share}
                disabled={sharing}
                style={[styles.shareBtn, styles.pdf, sharing && styles.dimmed]}>
                <ReportIcon size={17} color={Palette.gold} />
                <Text style={styles.pdfText}>PDF / Email</Text>
              </Pressable>
            </View>
            {sharing ? <Text style={styles.hint}>Generating PDF…</Text> : null}
            {shareError ? <Text style={styles.error}>{shareError}</Text> : null}

            <Text style={styles.note}>{report.note}</Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontFamily: Font.displayExtra, fontSize: 22, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  chips: { gap: 8, paddingRight: 20 },
  chip: {
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
  loading: { marginTop: 40 },
  section: { fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  list: { overflow: 'hidden', paddingVertical: 2 },
  empty: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  shareRow: { flexDirection: 'row', gap: 12 },
  shareBtn: {
    flex: 1,
    height: 54,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  whatsapp: { backgroundColor: '#25D366' },
  whatsappText: { fontFamily: Font.extrabold, fontSize: 15, color: Palette.white },
  pdf: { backgroundColor: Palette.ink },
  pdfText: { fontFamily: Font.bold, fontSize: 15, color: Palette.white },
  dimmed: { opacity: 0.6 },
  hint: { fontFamily: Font.medium, fontSize: 13, color: Palette.textMuted, textAlign: 'center' },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red, textAlign: 'center' },
  note: { fontFamily: Font.regular, fontSize: 12, lineHeight: 17, color: Palette.textFaint, textAlign: 'center' },
});
