import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';

/** "Assign to me" switch row for the new-task form. */
export function AssignToggle({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.assignRow}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}>
      <View style={styles.assignBody}>
        <Text style={styles.assignTitle}>Assign to me</Text>
        <Text style={styles.assignMeta}>
          {value ? 'You will be responsible for this task.' : 'Leave unassigned for now.'}
        </Text>
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 16,
  },
  assignBody: { flex: 1 },
  assignTitle: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  assignMeta: { marginTop: 2, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(27,23,18,0.15)',
    padding: 3,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: Palette.gold },
  knob: { width: 22, height: 22, borderRadius: 999, backgroundColor: Palette.white },
  knobOn: { alignSelf: 'flex-end' },
});
