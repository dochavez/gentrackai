import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette } from '@/constants/design';
import type { Task, TaskDueTone } from '@/features/tasks/types';

function dueColors(tone: TaskDueTone): { color: string; bg: string } {
  switch (tone) {
    case 'overdue':
      return { color: Palette.red, bg: Palette.redBg };
    case 'soon':
      return { color: Palette.goldText, bg: Palette.goldWash };
    case 'done':
      return { color: Palette.green, bg: Palette.greenBg };
    default:
      return { color: Palette.textMuted, bg: 'rgba(27,23,18,0.05)' };
  }
}

export function TaskCard({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const c = dueColors(task.dueTone);
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.done }}>
          {task.done ? (
            <CheckCircleIcon size={24} />
          ) : (
            <View style={[styles.checkbox, task.dueTone === 'overdue' && styles.checkboxOverdue]} />
          )}
        </Pressable>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, task.done && styles.titleDone]} numberOfLines={1}>
              {task.title}
            </Text>
            <Badge label={task.dueLabel} color={c.color} backgroundColor={c.bg} />
          </View>
          {task.generatorName ? <Text style={styles.gen}>{task.generatorName}</Text> : null}
        </View>
      </View>

      <View style={styles.assignee}>
        <View
          style={[
            styles.avatar,
            task.unassigned ? styles.avatarUnassigned : task.assignedToMe ? styles.avatarMe : styles.avatarOther,
          ]}>
          <Text
            style={[
              styles.avatarText,
              task.unassigned ? styles.avatarTextMuted : task.assignedToMe ? styles.avatarTextMe : styles.avatarTextOther,
            ]}>
            {task.unassigned ? '?' : (task.assigneeInitials ?? '?')}
          </Text>
        </View>
        <Text style={styles.assigneeName}>{task.assigneeName}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 12 },
  top: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(27,23,18,0.2)',
  },
  checkboxOverdue: { borderColor: Palette.alert },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flexShrink: 1, fontFamily: Font.bold, fontSize: 15.5, color: Palette.ink },
  titleDone: { color: Palette.textFaint, textDecorationLine: 'line-through' },
  gen: { marginTop: 2, fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
  assignee: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  avatarMe: { backgroundColor: Palette.ink },
  avatarOther: { backgroundColor: Palette.goldSoft },
  avatarUnassigned: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(27,23,18,0.2)' },
  avatarText: { fontFamily: Font.bold, fontSize: 11 },
  avatarTextMe: { color: Palette.gold },
  avatarTextOther: { color: Palette.planText },
  avatarTextMuted: { color: Palette.textFaint },
  assigneeName: { fontFamily: Font.semibold, fontSize: 13, color: Palette.textStrong },
});
