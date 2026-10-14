import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/constants/design';
import { statusColors } from '@/features/maintenance/constants';
import { useCompleteServiceForm } from '@/features/maintenance/hooks/use-complete-service-form';
import type { MaintenanceItem } from '@/features/maintenance/types';

/**
 * One scheduled maintenance item. Tapping the checkbox expands an optional cost
 * field; confirming calls `onComplete(cost)`. The completion form (expand +
 * cost + submit) lives in `useCompleteServiceForm`; this stays presentational.
 */
export function ScheduleRow({
  item,
  onComplete,
}: {
  item: MaintenanceItem;
  onComplete: (cost: number | null) => Promise<void>;
}) {
  const c = statusColors(item.status);
  const form = useCompleteServiceForm(onComplete);

  return (
    <View style={styles.item}>
      <View style={styles.itemMain}>
        {item.done ? (
          <CheckCircleIcon size={22} />
        ) : (
          <Pressable onPress={form.toggle} hitSlop={8} accessibilityLabel="Mark done">
            <View style={[styles.checkbox, item.status === 'overdue' && styles.checkboxOverdue]} />
          </Pressable>
        )}
        <View style={styles.itemBody}>
          <View style={styles.itemTop}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Badge label={item.statusLabel} color={c.color} backgroundColor={c.bg} />
          </View>
          <Text style={styles.itemMeta}>
            {[item.dateLabel, item.unassigned ? null : item.assigneeName, item.detail, item.costLabel]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
      </View>

      {form.completing && !item.done ? (
        <View style={styles.completeRow}>
          <View style={styles.costField}>
            <TextField
              label="Cost paid (optional)"
              placeholder="e.g. 95"
              keyboardType="decimal-pad"
              {...form.bind('cost')}
            />
          </View>
          <Pressable
            onPress={form.submit}
            disabled={form.submitting}
            style={[styles.markDone, form.submitting && styles.dimmed]}>
            <Text style={styles.markDoneText}>{form.submitting ? '…' : 'Mark done'}</Text>
          </Pressable>
        </View>
      ) : null}

      {form.error ? <Text style={styles.error}>{form.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { paddingHorizontal: 16, paddingVertical: 13 },
  itemMain: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(27,23,18,0.2)',
    marginTop: 1,
  },
  checkboxOverdue: { borderColor: Palette.alert },
  itemBody: { flex: 1 },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flexShrink: 1, fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  itemMeta: { marginTop: 2, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  completeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginTop: 12, paddingLeft: 34 },
  costField: { flex: 1 },
  markDone: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markDoneText: { fontFamily: Font.bold, fontSize: 14, color: Palette.white },
  dimmed: { opacity: 0.6 },
  error: { marginTop: 8, paddingLeft: 34, fontFamily: Font.medium, fontSize: 12.5, color: Palette.red },
});
