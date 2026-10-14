import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette } from '@/constants/design';
import type { Member } from '@/features/team/types';

type Row = { id: string | null; name: string; meta: string | null };

/**
 * Single-select list of organization members (plus an "Unassigned" option) for
 * assigning a maintenance service. Mirrors the tasks `GeneratorPicker` pattern.
 * `null` id means unassigned. Presentational — the parent owns the selection.
 */
export function AssigneePicker({
  members,
  selectedId,
  currentUserId,
  onSelect,
}: {
  members: Member[];
  selectedId: string | null;
  currentUserId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const rows: Row[] = [
    { id: null, name: 'Unassigned', meta: null },
    ...members.map((m) => ({
      id: m.id,
      name: m.id === currentUserId ? 'You' : (m.name ?? m.email),
      meta: m.email,
    })),
  ];

  return (
    <View>
      <Text style={styles.groupLabel}>Assign to</Text>
      <Card style={styles.pickerCard}>
        {rows.map((row, i) => {
          const selected = selectedId === row.id;
          return (
            <Pressable
              key={row.id ?? 'unassigned'}
              onPress={() => onSelect(row.id)}
              style={[styles.row, i > 0 && styles.rowDivider]}>
              <View style={styles.body}>
                <Text style={styles.name}>{row.name}</Text>
                {row.meta ? <Text style={styles.meta}>{row.meta}</Text> : null}
              </View>
              {selected ? <CheckCircleIcon size={22} /> : <View style={styles.radio} />}
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  groupLabel: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 8 },
  pickerCard: { overflow: 'hidden', paddingVertical: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: Palette.hairline },
  body: { flex: 1 },
  name: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  meta: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  radio: { width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: 'rgba(27,23,18,0.2)' },
});
