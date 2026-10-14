/**
 * Edit a generator's details — name, location, running status, fuel burn rate,
 * spec sheet, and label photo. Consumption *values* (fuel/run-hours/battery)
 * are corrected via the Log-reading flow, not here. Presented as a modal.
 *
 * View-only: all state, validation, image picking, and the save/delete calls
 * live in `useEditGeneratorForm`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons/close-icon';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/constants/design';
import { PhotoField } from '@/features/generators/components/photo-field';
import { SegmentedControl } from '@/features/generators/components/segmented-control';
import { SPEC_FIELDS, STATUSES } from '@/features/generators/constants';
import { useEditGeneratorForm } from '@/features/generators/hooks/use-edit-generator-form';

export function EditGeneratorScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useEditGeneratorForm(id);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Close">
          <CloseIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit generator</Text>
        <View style={styles.iconBtn} />
      </View>

      {form.isLoading && !form.ready ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <PhotoField uri={form.previewUri} onPress={form.changePhoto} />

          <TextField label="Name" {...form.bind('name')} />
          <TextField label="Location" placeholder="e.g. Warehouse B" {...form.bind('location')} />

          <View>
            <Text style={styles.groupLabel}>Status</Text>
            <SegmentedControl
              options={STATUSES}
              value={form.status}
              onChange={form.setStatus}
              size={12.5}
            />
          </View>

          <View style={styles.burnRow}>
            <View style={styles.burnField}>
              <TextField
                label="Fuel burn rate"
                placeholder="e.g. 8"
                keyboardType="decimal-pad"
                {...form.bind('burnRate')}
              />
            </View>
            <Text style={styles.unit}>%/hr</Text>
          </View>
          <Text style={styles.hint}>
            Estimated % of tank burned per running hour. Leave blank if unknown — fuel then stays flat until
            you log a reading.
          </Text>

          <Text style={styles.groupLabel}>Specifications</Text>
          {SPEC_FIELDS.map((f) => (
            <TextField key={f.key} label={f.label} {...form.bind(f.key)} />
          ))}

          {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

          <Button
            label="Save changes"
            onPress={form.submit}
            loading={form.submitting}
            disabled={form.submitting}
          />

          <Pressable
            onPress={form.delete}
            disabled={form.deleting}
            style={[styles.delete, form.confirmingDelete && styles.deleteConfirm]}
            accessibilityLabel="Delete generator">
            <Text style={[styles.deleteText, form.confirmingDelete && styles.deleteTextConfirm]}>
              {form.deleting
                ? 'Deleting…'
                : form.confirmingDelete
                  ? 'Tap again to delete'
                  : 'Delete generator'}
            </Text>
          </Pressable>
          {form.confirmingDelete && !form.deleting ? (
            <Text style={styles.deleteHint} onPress={form.cancelDelete}>
              Cancel
            </Text>
          ) : null}
        </ScrollView>
      )}
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Font.displayBold,
    fontSize: 18,
    color: Palette.ink,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 14 },
  groupLabel: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 2, marginTop: 2 },
  burnRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  burnField: { flex: 1 },
  unit: { paddingBottom: 15, fontFamily: Font.displayBold, fontSize: 16, color: Palette.textMuted },
  hint: { fontFamily: Font.regular, fontSize: 12.5, lineHeight: 17, color: Palette.textMuted, marginTop: -4 },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red },
  delete: {
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.redBg,
    backgroundColor: Palette.redBg,
    marginTop: 2,
  },
  deleteConfirm: { backgroundColor: Palette.red, borderColor: Palette.red },
  deleteText: { fontFamily: Font.bold, fontSize: 15, color: Palette.red },
  deleteTextConfirm: { color: Palette.white },
  deleteHint: { textAlign: 'center', fontFamily: Font.semibold, fontSize: 13, color: Palette.textMuted },
});
