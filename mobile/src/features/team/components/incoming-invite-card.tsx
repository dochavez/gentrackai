import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UsersIcon } from '@/components/ui/icons/users-icon';
import { Font, Palette } from '@/constants/design';
import { roleLabel } from '@/features/team/constants';
import type { IncomingInvitation } from '@/features/team/types';

/** A prompt for the current user to accept/decline an invitation to a team. */
export function IncomingInviteCard({
  invitation,
  busy,
  onAccept,
  onDecline,
}: {
  invitation: IncomingInvitation;
  busy: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <UsersIcon size={16} color={Palette.goldText} />
        <Text style={styles.kicker}>Team invitation</Text>
      </View>
      <Text style={styles.title}>
        Join {invitation.organizationName ?? 'a team'} as {roleLabel(invitation.role)}
      </Text>
      {invitation.invitedBy ? <Text style={styles.by}>Invited by {invitation.invitedBy}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onDecline(invitation.id)}
          disabled={busy}
          style={[styles.btn, styles.decline]}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
        <Pressable
          onPress={() => onAccept(invitation.id)}
          disabled={busy}
          style={[styles.btn, styles.accept]}>
          <Text style={styles.acceptText}>Accept</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: Palette.goldSoft,
    experimental_backgroundImage: 'linear-gradient(135deg, #FFF3D1, #FFE7A8)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kicker: { fontFamily: Font.extrabold, fontSize: 12.5, color: Palette.planText },
  title: { marginTop: 8, fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  by: { marginTop: 2, fontFamily: Font.regular, fontSize: 13, color: Palette.onGoldSubtitle },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  decline: { backgroundColor: 'rgba(27,23,18,0.08)' },
  declineText: { fontFamily: Font.bold, fontSize: 14, color: Palette.ink },
  accept: { backgroundColor: Palette.ink },
  acceptText: { fontFamily: Font.extrabold, fontSize: 14, color: Palette.gold },
});
