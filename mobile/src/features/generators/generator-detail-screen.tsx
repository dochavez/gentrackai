/**
 * Generator detail — hero, live gauges, and the AI-identified spec sheet.
 * Presented full-screen (from the scan flow or the fleet list).
 *
 * View-only: data loading, the spec rows, and navigation live in
 * `useGeneratorDetail`; the status → theme mapping stays here (pure UI).
 */

import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarIcon } from '@/components/ui/icons/calendar-icon';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { EditIcon } from '@/components/ui/icons/edit-icon';
import { FleetIcon } from '@/components/ui/icons/fleet-icon';
import { TasksIcon } from '@/components/ui/icons/tasks-icon';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { Gauge } from '@/features/generators/components/gauge';
import { MONITORING_GAUGES_ENABLED } from '@/features/generators/constants';
import { SpecList } from '@/features/generators/components/spec-list';
import { StatusPill } from '@/features/generators/components/status-pill';
import { useGeneratorDetail } from '@/features/generators/hooks/use-generator-detail';
import { statusDisplay } from '@/features/generators/status';

export function GeneratorDetailScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { generator, isLoading, goBack, openReading, openEdit, openRequestMaintenance, openTask, specItems } =
    useGeneratorDetail(id);

  if (isLoading || !generator) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style="dark" />
        {isLoading ? (
          <ActivityIndicator color={Palette.gold} />
        ) : (
          <Text style={styles.notFound}>Generator not found.</Text>
        )}
        <Text style={[styles.back, { top: insets.top + 12 }]} onPress={goBack}>
          ← Back
        </Text>
      </View>
    );
  }

  const s = statusDisplay(generator.status);
  const heroGradient = s.ok
    ? 'linear-gradient(160deg, #DFF3E7, #BFE8CE)'
    : 'linear-gradient(160deg, #FFE7A8, #FFD54A)';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: s.ok ? Palette.greenBg : Palette.goldSoft, experimental_backgroundImage: heroGradient }]}>
        <Pressable
          onPress={goBack}
          style={[styles.heroBtn, { top: insets.top + 8 }]}
          accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Pressable
          onPress={openEdit}
          style={[styles.heroBtn, styles.heroBtnRight, { top: insets.top + 8 }]}
          accessibilityLabel="Edit generator">
          <EditIcon size={18} color={Palette.ink} />
        </Pressable>
        <View style={styles.heroIcon}>
          <FleetIcon size={120} color={Palette.ink} />
        </View>
        <View style={styles.heroPill}>
          <StatusPill status={generator.status} />
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        {generator.confidence != null ? (
          <View style={styles.matchBadge}>
            <Text style={styles.matchText}>Identified from photo · {generator.confidence}% match</Text>
          </View>
        ) : null}

        <Text style={styles.name}>{generator.name}</Text>
        <Text style={styles.location}>{generator.location ?? 'No location set'}</Text>

        {/* Gauges — tap to log a fresh reading. Fuel/Battery are hidden for now
            (live-monitoring data the app can't source); see MONITORING_GAUGES_ENABLED. */}
        <View style={styles.gauges}>
          {MONITORING_GAUGES_ENABLED ? (
            <>
              <Gauge
                value={generator.fuelLevel != null ? String(generator.fuelLevel) : '—'}
                unit="%"
                label="Fuel"
                caption={generator.fuelCaption}
                live={generator.isRunning}
                onPress={() => openReading('fuel')}
              />
              <Gauge
                value={generator.batteryVoltage != null ? String(generator.batteryVoltage) : '—'}
                unit="V"
                label="Battery"
                color={Palette.green}
                caption={generator.batteryCaption}
                onPress={() => openReading('battery')}
              />
            </>
          ) : null}
          <Gauge
            value={String(generator.runHours)}
            label="Run hrs"
            caption={generator.runHoursCaption}
            live={generator.isRunning}
            onPress={() => openReading('run_hours')}
            style={MONITORING_GAUGES_ENABLED ? undefined : styles.soloGauge}
          />
        </View>
        <Text style={styles.gaugeHint}>Tap a gauge to log a reading.</Text>

        <Text style={styles.sectionTitle}>Specifications</Text>
        {specItems.length > 0 ? (
          <View style={styles.specs}>
            <SpecList items={specItems} />
          </View>
        ) : (
          <Text style={styles.empty}>No specifications captured yet.</Text>
        )}

        <View style={styles.actions}>
          {/* Maintenance is performed by external technicians — the end user
              requests a service (the marketplace), they don't schedule it themselves. */}
          <Pressable style={styles.primary} onPress={openRequestMaintenance}>
            <CalendarIcon size={19} color={Palette.ink} />
            <Text style={styles.primaryLabel}>Schedule Maintenance</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={openTask}>
            <TasksIcon size={18} color={Palette.gold} />
            <Text style={styles.secondaryLabel}>Assign a task</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFound: {
    fontFamily: Font.medium,
    fontSize: 15,
    color: Palette.textMuted,
  },
  back: {
    position: 'absolute',
    left: 20,
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.ink,
  },
  hero: {
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBtn: {
    position: 'absolute',
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnRight: {
    left: undefined,
    right: 20,
  },
  heroIcon: {
    opacity: 0.9,
  },
  heroPill: {
    position: 'absolute',
    left: 20,
    bottom: 14,
  },
  content: {
    paddingHorizontal: wp(IS_TABLET ? 12 : 5),
    paddingTop: 18,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.greenBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  matchText: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: Palette.green,
  },
  name: {
    marginTop: 10,
    fontFamily: Font.displayExtra,
    fontSize: 26,
    lineHeight: 29,
    color: Palette.ink,
  },
  location: {
    marginTop: 2,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textMuted,
  },
  gauges: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 10,
  },
  // When the monitoring gauges are hidden, keep the lone Run-hrs card at its
  // natural (~one-third) width instead of stretching across the row.
  soloGauge: {
    flex: 0,
    width: '31.5%',
  },
  gaugeHint: {
    marginTop: 8,
    fontFamily: Font.regular,
    fontSize: 12,
    color: Palette.textFaint,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 16,
    fontFamily: Font.displayBold,
    fontSize: 16,
    color: Palette.ink,
  },
  specs: {
    marginTop: 10,
  },
  empty: {
    marginTop: 10,
    fontFamily: Font.regular,
    fontSize: 13.5,
    color: Palette.textMuted,
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  primary: {
    height: 54,
    borderRadius: 15,
    backgroundColor: Palette.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryLabel: {
    fontFamily: Font.extrabold,
    fontSize: 16,
    color: Palette.ink,
  },
  outline: {
    height: 52,
    borderRadius: 15,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.gold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineLabel: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.ink,
  },
  secondary: {
    height: 52,
    borderRadius: 15,
    backgroundColor: Palette.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryLabel: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.white,
  },
});
