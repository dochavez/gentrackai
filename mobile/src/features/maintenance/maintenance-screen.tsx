/**
 * Maintenance schedule for one generator — recommended cycle, the scheduled
 * items (with backend-computed status/date labels), and a "schedule a service"
 * form. Reached from the generator detail screen. State, validation, and data
 * wiring live in `useMaintenanceSchedule`; this component just composes.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { CalendarIcon } from '@/components/ui/icons/calendar-icon';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/constants/design';
import { AssigneePicker } from '@/features/maintenance/components/assignee-picker';
import { ScheduleRow } from '@/features/maintenance/components/schedule-row';
import { DUE_OPTIONS } from '@/features/maintenance/constants';
import { useMaintenanceSchedule } from '@/features/maintenance/hooks/use-maintenance-schedule';

export function MaintenanceScreen({ generatorId }: { generatorId: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useMaintenanceSchedule(generatorId);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Maintenance</Text>
          {form.generatorName ? <Text style={styles.subtitle}>{form.generatorName}</Text> : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}>
        <Card style={styles.cycleCard}>
          <View style={styles.cycleIcon}>
            <WrenchIcon size={20} color={Palette.goldText} />
          </View>
          <View style={styles.cycleBody}>
            <Text style={styles.cycleTitle}>Recommended cycle</Text>
            {form.recommendedCycle ? <Text style={styles.cycleText}>{form.recommendedCycle}</Text> : null}
          </View>
        </Card>

        <Text style={styles.section}>Schedule</Text>
        {form.isLoading ? (
          <ActivityIndicator color={Palette.gold} style={styles.loading} />
        ) : form.items.length > 0 ? (
          <Card style={styles.list}>
            {form.items.map((item) => (
              <ScheduleRow key={item.id} item={item} onComplete={(cost) => form.complete(item.id, cost)} />
            ))}
          </Card>
        ) : (
          <Text style={styles.empty}>Nothing scheduled yet.</Text>
        )}

        <Card style={styles.form}>
          <View style={styles.formHead}>
            <CalendarIcon size={18} color={Palette.ink} />
            <Text style={styles.formTitle}>Schedule a service</Text>
          </View>
          <TextField label="Service" placeholder="e.g. Oil & filter change" {...form.bind('title')} />
          <Text style={styles.dueLabel}>Due</Text>
          <View style={styles.chips}>
            {DUE_OPTIONS.map((opt) => {
              const active = form.presetActive(opt.days);
              return (
                <Text
                  key={opt.days}
                  accessibilityRole="button"
                  onPress={() => form.selectDuePreset(opt.days)}
                  style={[styles.chip, active && styles.chipActive]}>
                  {opt.label}
                </Text>
              );
            })}
          </View>
          <DateField
            label="Or pick a date"
            value={form.dueDate}
            onChange={form.pickDate}
            minimumDate={new Date()}
          />
          <AssigneePicker
            members={form.members}
            selectedId={form.assigneeId}
            currentUserId={form.currentUserId}
            onSelect={form.selectAssignee}
          />
          {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
          <Button
            label="Schedule service"
            onPress={form.submit}
            loading={form.submitting}
            disabled={form.submitting}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  headerBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
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
  title: { fontFamily: Font.displayExtra, fontSize: 24, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 16 },
  cycleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  cycleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleBody: { flex: 1 },
  cycleTitle: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  cycleText: { marginTop: 1, fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
  section: { fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  loading: { alignSelf: 'flex-start' },
  empty: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  list: { overflow: 'hidden', paddingVertical: 4 },
  form: { padding: 18, gap: 12 },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formTitle: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  dueLabel: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: Palette.textStrong,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: Palette.ink, color: Palette.white, borderColor: Palette.ink },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red },
});
