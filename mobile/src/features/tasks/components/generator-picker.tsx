import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette } from '@/constants/design';
import type { Generator } from '@/features/generators/types';

/** Single-select list of the user's generators for the new-task form. */
export function GeneratorPicker({
  generators,
  selectedId,
  onSelect,
}: {
  generators: Generator[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <View>
      <Text style={styles.groupLabel}>Generator</Text>
      {generators.length === 0 ? (
        <Text style={styles.hint}>Add a generator first to assign tasks to it.</Text>
      ) : (
        <Card style={styles.pickerCard}>
          {generators.map((g, i) => {
            const selected = selectedId === g.id;
            return (
              <Pressable
                key={g.id}
                onPress={() => onSelect(g.id)}
                style={[styles.genRow, i > 0 && styles.genRowDivider]}>
                <View style={styles.genBody}>
                  <Text style={styles.genName}>{g.name}</Text>
                  {g.location ? <Text style={styles.genMeta}>{g.location}</Text> : null}
                </View>
                {selected ? <CheckCircleIcon size={22} /> : <View style={styles.radio} />}
              </Pressable>
            );
          })}
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  groupLabel: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 8 },
  hint: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  pickerCard: { overflow: 'hidden', paddingVertical: 2 },
  genRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  genRowDivider: { borderTopWidth: 1, borderTopColor: Palette.hairline },
  genBody: { flex: 1 },
  genName: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  genMeta: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(27,23,18,0.2)',
  },
});
