import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import { INVITE_ROLES } from '@/features/team/constants';
import type { InviteRole } from '@/features/team/types';

/** Member / Admin segmented toggle (owner is not assignable). */
export function RoleControl({
  value,
  onChange,
  disabled = false,
}: {
  value: InviteRole;
  onChange: (role: InviteRole) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      {INVITE_ROLES.map((r) => {
        const active = r.key === value;
        return (
          <Pressable
            key={r.key}
            disabled={disabled}
            onPress={() => onChange(r.key)}
            style={[styles.item, active && styles.itemActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{r.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  item: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  itemActive: { backgroundColor: Palette.ink },
  text: { fontFamily: Font.semibold, fontSize: 12.5, color: Palette.textStrong },
  textActive: { fontFamily: Font.bold, color: Palette.white },
});
