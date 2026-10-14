import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';
import { RoleBadge } from '@/features/team/components/role-badge';
import type { PendingInvitation } from '@/features/team/types';

/** A pending invitation the org has sent, with a cancel action. */
export function InvitationRow({
  invitation,
  busy,
  onCancel,
}: {
  invitation: PendingInvitation;
  busy: boolean;
  onCancel: (id: string) => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.body}>
        <Text style={styles.email} numberOfLines={1}>
          {invitation.email}
        </Text>
        <Text style={styles.meta}>
          {['Pending', invitation.invitedAgo].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <RoleBadge role={invitation.role} />
      <Pressable onPress={() => onCancel(invitation.id)} disabled={busy} hitSlop={8} style={styles.cancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  body: { flex: 1 },
  email: { fontFamily: Font.bold, fontSize: 14, color: Palette.ink },
  meta: { marginTop: 1, fontFamily: Font.regular, fontSize: 12, color: Palette.textFaint },
  cancel: { paddingHorizontal: 6, paddingVertical: 4 },
  cancelText: { fontFamily: Font.bold, fontSize: 13, color: Palette.red },
});
