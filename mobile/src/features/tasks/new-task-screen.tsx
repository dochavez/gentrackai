/**
 * New task — title, the generator it belongs to, an optional due date, and an
 * "assign to me" toggle. Presented as a modal; can arrive with a generator
 * preselected (from a generator's detail screen). Form state/validation lives
 * in `useNewTaskForm` (Formik + Yup); this component just composes.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons/close-icon';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/constants/design';
import { AssignToggle } from '@/features/tasks/components/assign-toggle';
import { DueChips } from '@/features/tasks/components/due-chips';
import { GeneratorPicker } from '@/features/tasks/components/generator-picker';
import { useNewTaskForm } from '@/features/tasks/hooks/use-new-task-form';

export function NewTaskScreen({ generatorId }: { generatorId?: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useNewTaskForm({ generatorId });

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Close">
          <CloseIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>New task</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TextField
          label="Task"
          placeholder="e.g. Weekly load-bank test"
          autoFocus
          {...form.bind('title')}
        />

        <GeneratorPicker
          generators={form.generators}
          selectedId={form.selectedGenerator}
          onSelect={form.selectGenerator}
        />

        <DueChips value={form.dueDays} onSelect={form.selectDue} />

        <AssignToggle value={form.assignToMe} onToggle={form.toggleAssignToMe} />

        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <Button label="Create task" onPress={form.submit} loading={form.submitting} disabled={form.submitting} />
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Font.displayBold,
    fontSize: 18,
    color: Palette.ink,
  },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red },
});
