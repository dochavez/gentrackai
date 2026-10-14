/**
 * Team — the organization's members and their roles. Owners/admins can invite
 * people, change roles, remove members, and cancel pending invitations. Reached
 * from the Account screen. State/actions live in `useTeam`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { PlusIcon } from '@/components/ui/icons/plus-icon';
import { Font, Palette } from '@/constants/design';
import { IncomingInviteCard } from '@/features/team/components/incoming-invite-card';
import { InvitationRow } from '@/features/team/components/invitation-row';
import { MemberRow } from '@/features/team/components/member-row';
import { useIncomingInvitations } from '@/features/team/hooks/use-incoming-invitations';
import { useTeam } from '@/features/team/hooks/use-team';

export function TeamScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { organization, canManageTeam, members, invitations, isLoading, busyId, changeRole, remove, cancelInvite } =
    useTeam();
  const incoming = useIncomingInvitations();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Team</Text>
          {organization?.name ? <Text style={styles.subtitle}>{organization.name}</Text> : null}
        </View>
        {canManageTeam ? (
          <Pressable onPress={() => router.push('/invite')} style={styles.invite} accessibilityLabel="Invite teammate">
            <PlusIcon size={18} color={Palette.ink} />
            <Text style={styles.inviteText}>Invite</Text>
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}
      </View>

      {isLoading && !organization ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}>
          {incoming.invitations.length > 0 ? (
            <View style={styles.list}>
              {incoming.invitations.map((inv) => (
                <IncomingInviteCard
                  key={inv.id}
                  invitation={inv}
                  busy={incoming.busyId === inv.id}
                  onAccept={incoming.accept}
                  onDecline={incoming.decline}
                />
              ))}
            </View>
          ) : null}

          <Text style={styles.section}>Members</Text>
          <View style={styles.list}>
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                canManage={canManageTeam}
                busy={busyId === m.id}
                onChangeRole={changeRole}
                onRemove={remove}
              />
            ))}
          </View>

          {canManageTeam && invitations.length > 0 ? (
            <>
              <Text style={styles.section}>Pending invitations</Text>
              <View style={styles.list}>
                {invitations.map((i) => (
                  <InvitationRow key={i.id} invitation={i} busy={busyId === i.id} onCancel={cancelInvite} />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontFamily: Font.displayExtra, fontSize: 24, color: Palette.ink },
  subtitle: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: Palette.gold,
  },
  inviteText: { fontFamily: Font.bold, fontSize: 13.5, color: Palette.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 12 },
  section: { marginTop: 6, fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  list: { gap: 10 },
});
