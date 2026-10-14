/**
 * Log a usage reading (fuel %, run hours, or battery volts) for a generator.
 * The backend re-anchors its consumption projection from this reading, so the
 * displayed values start drifting again from the value entered here. Presented
 * as a modal; can arrive with a metric preselected (from tapping a gauge).
 *
 * View-only: metric selection, validation, and the `logReading` call live in
 * `useLogReadingForm`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons/close-icon';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/constants/design';
import { SegmentedControl } from '@/features/generators/components/segmented-control';
import { METRICS } from '@/features/generators/constants';
import { useLogReadingForm } from '@/features/generators/hooks/use-log-reading-form';
import type { ReadingMetric } from '@/features/generators/types';

export function LogReadingScreen({
  generatorId,
  metric,
}: {
  generatorId: string;
  metric?: ReadingMetric;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useLogReadingForm(generatorId, metric);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Close">
          <CloseIcon size={18} color={Palette.ink} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Log reading</Text>
          {form.generator?.name ? <Text style={styles.headerSub}>{form.generator.name}</Text> : null}
        </View>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <SegmentedControl options={METRICS} value={form.metric} onChange={form.selectMetric} />

        <View style={styles.valueRow}>
          <View style={styles.valueField}>
            <TextField
              label={`Current ${form.active.label.toLowerCase()}`}
              placeholder={form.active.placeholder}
              keyboardType="decimal-pad"
              autoFocus
              {...form.bind('value')}
            />
          </View>
          <Text style={styles.unit}>{form.active.unit}</Text>
        </View>

        <TextField
          label="Note (optional)"
          placeholder="e.g. After refuel"
          {...form.bind('note')}
        />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <Button label="Log reading" onPress={form.submit} loading={form.submitting} disabled={form.submitting} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  headerSub: { fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  valueField: { flex: 1 },
  unit: { paddingBottom: 15, fontFamily: Font.displayBold, fontSize: 18, color: Palette.textMuted },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red },
});
