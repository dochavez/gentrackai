/**
 * Tasks — the user's maintenance tasks with All / Overdue / Assigned / Unassigned
 * filters (counts come from the backend). Tapping a task's checkbox toggles it
 * done. Reached from the Tasks tab. "+" opens the new-task flow. All state and
 * data wiring live in `useTaskList`; this component just composes.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlusIcon } from '@/components/ui/icons/plus-icon';
import { ReportIcon } from '@/components/ui/icons/report-icon';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { TaskCard } from '@/features/tasks/components/task-card';
import { TaskFilterChips } from '@/features/tasks/components/task-filter-chips';
import { useTaskList } from '@/features/tasks/hooks/use-task-list';

export function TasksScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, counts, isLoading, filter, setFilter, toggle } = useTaskList();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Tasks</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push('/maintenance-report')}
              style={styles.report}
              accessibilityLabel="Maintenance report">
              <ReportIcon size={16} color={Palette.ink} />
              <Text style={styles.reportText}>Report</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/new-task')}
              style={styles.add}
              accessibilityLabel="New task">
              <PlusIcon size={22} color={Palette.ink} />
            </Pressable>
          </View>
        </View>

        <TaskFilterChips active={filter} counts={counts} onSelect={setFilter} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>{filter === 'all' ? 'No tasks yet' : 'Nothing here'}</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'Add a task, or assign one from a generator.' : 'Try another filter.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 112 }]}
          showsVerticalScrollIndicator={false}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onToggle={() => toggle(t.id, !t.done)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: { paddingHorizontal: wp(IS_TABLET ? 12 : 5), paddingBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Font.displayExtra, fontSize: 28, color: Palette.ink },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  report: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  reportText: { fontFamily: Font.bold, fontSize: 13.5, color: Palette.ink },
  add: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 6, paddingBottom: 80 },
  emptyTitle: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  emptyText: { textAlign: 'center', fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  list: { paddingHorizontal: wp(IS_TABLET ? 12 : 5), paddingTop: 12, gap: 12 },
});
