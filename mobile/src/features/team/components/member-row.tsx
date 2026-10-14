import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';
import { RoleBadge } from '@/features/team/components/role-badge';
import { RoleControl } from '@/features/team/components/role-control';
import type { InviteRole, Member } from '@/features/team/types';

/**
 * One organization member. Owner/admin viewers get inline role + remove
 * controls for manageable members (not the owner, not themselves).
 */
export function MemberRow({
  member,
  canManage,
  busy,
  onChangeRole,
  onRemove,
}: {
  member: Member;
  canManage: boolean;
  busy: boolean;
  onChangeRole: (id: string, role: InviteRole) => void;
  onRemove: (id: string) => void;
}) {
  const manageable = canManage && !member.isMe && member.role !== 'owner';
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{member.initials}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>
            {member.name ?? member.email}
            {member.isMe ? ' (You)' : ''}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {member.email}
          </Text>
        </View>
        {!manageable ? <RoleBadge role={member.role} /> : null}
      </View>

      {manageable ? (
        <View style={styles.actions}>
          <View style={styles.roleControl}>
            <RoleControl
              value={member.role === 'admin' ? 'admin' : 'member'}
              onChange={(role) => onChangeRole(member.id, role)}
              disabled={busy}
            />
          </View>
          <Pressable
            onPress={() => {
              if (confirmRemove) {
                onRemove(member.id);
              } else {
                setConfirmRemove(true);
              }
            }}
            disabled={busy}
            style={[styles.remove, confirmRemove && styles.removeConfirm]}>
            <Text style={[styles.removeText, confirmRemove && styles.removeTextConfirm]}>
              {confirmRemove ? 'Confirm' : 'Remove'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: Font.bold, fontSize: 14, color: Palette.gold },
  body: { flex: 1 },
  name: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  email: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleControl: { flex: 1 },
  remove: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.redBg,
  },
  removeConfirm: { backgroundColor: Palette.red },
  removeText: { fontFamily: Font.bold, fontSize: 13, color: Palette.red },
  removeTextConfirm: { color: Palette.white },
});
