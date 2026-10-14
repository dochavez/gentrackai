import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette } from '@/constants/design';
import type { Member } from '@/features/team/types';

/** Pick a provider-org member to carry out a job (owner/admin only). */
export function AssignPicker({
  members,
  assignedId,
  busy,
  onAssign,
}: {
  members: Member[];
  assignedId: string | null;
  busy: boolean;
  onAssign: (userId: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>Assign a technician</Text>
      {members.map((m) => {
        const on = m.id === assignedId;
        return (
          <Pressable
            key={m.id}
            style={[styles.row, on && styles.rowOn]}
            onPress={() => onAssign(m.id)}
            disabled={busy}
            accessibilityLabel={`Assign ${m.name}`}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{m.initials}</Text>
            </View>
            <Text style={styles.name}>{m.name}</Text>
            {on ? <CheckCircleIcon size={20} color={Palette.gold} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  label: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 14,
    padding: 12,
  },
  rowOn: { borderColor: Palette.gold },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.extrabold, fontSize: 13, color: Palette.gold },
  name: { flex: 1, fontFamily: Font.semibold, fontSize: 14.5, color: Palette.ink },
});
