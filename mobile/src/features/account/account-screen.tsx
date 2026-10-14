/**
 * Account screen — shows the signed-in user and the log-out action. Reached by
 * tapping the avatar on Home. After sign-out the root auth gate redirects to
 * the sign-in flow.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { ChevronRightIcon } from '@/components/ui/icons/chevron-right-icon';
import { EditIcon } from '@/components/ui/icons/edit-icon';
import { UsersIcon } from '@/components/ui/icons/users-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { Font, Palette } from '@/constants/design';
import { useAppSection } from '@/hooks/use-app-section';
import { useAuth } from '@/hooks/use-auth';
import { useOrganizationSwitcher } from '@/hooks/use-organization-switcher';

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

export function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, deleteAccount } = useAuth();
  const { goToTechnician } = useAppSection();
  const { organizations, currentId, switchingId, switchTo } = useOrganizationSwitcher();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const busy = loading || deleting;

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      // The root auth gate redirects to /sign-in once isSignedIn flips.
    } catch {
      setLoading(false);
    }
  };

  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      // On success the session is torn down and the auth gate redirects to /sign-in.
    } catch (e) {
      setDeleting(false);
      Alert.alert(
        'Could not delete account',
        e instanceof Error ? e.message : 'Please try again.',
      );
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and personal data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: onDeleteAccount },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Account</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.initials ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'Your account'}</Text>
        {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        <View style={styles.providerPill}>
          <Text style={styles.providerText}>
            {user?.provider === 'google' ? 'Signed in with Google' : 'Email account'}
          </Text>
        </View>

        {organizations.length > 0 ? (
          <View style={styles.orgSection}>
            <Text style={styles.orgLabel}>
              {organizations.length > 1 ? 'Organizations' : 'Organization'}
            </Text>
            <View style={styles.orgList}>
              {organizations.map((org) => {
                const isCurrent = org.id === currentId;
                const isSwitching = switchingId === org.id;
                return (
                  <Pressable
                    key={org.id}
                    style={[styles.teamRow, isCurrent && styles.teamRowCurrent]}
                    onPress={() => (isCurrent ? router.push('/team') : switchTo(org.id))}
                    disabled={switchingId !== null && !isCurrent}
                    accessibilityLabel={isCurrent ? `${org.name}, view team` : `Switch to ${org.name}`}>
                    <View style={styles.teamIcon}>
                      <UsersIcon size={20} color={Palette.ink} />
                    </View>
                    <View style={styles.teamBody}>
                      <Text style={styles.teamName} numberOfLines={1}>
                        {org.name}
                      </Text>
                      <Text style={styles.teamSub}>
                        {ROLE_LABELS[org.role] ?? 'Member'} · {isCurrent ? 'View team' : 'Switch'}
                      </Text>
                    </View>
                    {isSwitching ? (
                      <ActivityIndicator color={Palette.gold} />
                    ) : isCurrent ? (
                      <CheckCircleIcon size={20} color={Palette.gold} />
                    ) : (
                      <ChevronRightIcon size={18} color={Palette.textMuted} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.planSection}>
          <Pressable
            style={styles.teamRow}
            onPress={() => router.push('/edit-profile')}
            accessibilityLabel="Edit profile">
            <View style={styles.teamIcon}>
              <EditIcon size={20} color={Palette.ink} />
            </View>
            <View style={styles.teamBody}>
              <Text style={styles.teamName}>Edit profile</Text>
              <Text style={styles.teamSub}>Name · service address</Text>
            </View>
            <ChevronRightIcon size={18} color={Palette.textMuted} />
          </Pressable>
        </View>

        <View style={styles.planSection}>
          <Pressable
            style={styles.teamRow}
            onPress={() => (user?.isTechnician ? goToTechnician() : router.push('/technician-onboarding'))}
            accessibilityLabel={user?.isTechnician ? 'Switch to technician mode' : 'Become a technician'}>
            <View style={styles.teamIcon}>
              <WrenchIcon size={20} color={Palette.goldText} />
            </View>
            <View style={styles.teamBody}>
              <Text style={styles.teamName}>
                {user?.isTechnician ? 'Technician mode' : 'Become a technician'}
              </Text>
              <Text style={styles.teamSub}>
                {user?.isTechnician ? 'Switch to your requests & jobs' : 'Get maintenance jobs near you'}
              </Text>
            </View>
            <ChevronRightIcon size={18} color={Palette.textMuted} />
          </Pressable>
        </View>

        <View style={styles.planSection}>
          <Pressable
            style={styles.teamRow}
            onPress={() => router.push('/upgrade')}
            accessibilityLabel="Plan and billing">
            <View style={styles.teamIcon}>
              <BoltIcon size={20} color={Palette.goldText} />
            </View>
            <View style={styles.teamBody}>
              <Text style={styles.teamName}>Plan & billing</Text>
              <Text style={styles.teamSub}>View plans · Upgrade to Pro</Text>
            </View>
            <ChevronRightIcon size={18} color={Palette.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <Pressable
          onPress={onLogout}
          disabled={busy}
          style={({ pressed }) => [styles.logout, pressed && styles.dim, busy && styles.dim]}>
          {loading ? (
            <ActivityIndicator color={Palette.red} />
          ) : (
            <Text style={styles.logoutText}>Log out</Text>
          )}
        </Pressable>

        <Pressable
          onPress={confirmDeleteAccount}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          style={({ pressed }) => [styles.deleteAccount, pressed && styles.dim, busy && styles.dim]}>
          {deleting ? (
            <ActivityIndicator color={Palette.red} />
          ) : (
            <Text style={styles.deleteAccountText}>Delete account</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  title: {
    fontFamily: Font.displayBold,
    fontSize: 17,
    color: Palette.ink,
  },
  flex: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  orgSection: {
    marginTop: 28,
    alignSelf: 'stretch',
  },
  planSection: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  orgLabel: {
    marginLeft: 2,
    marginBottom: 10,
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  orgList: {
    gap: 10,
  },
  teamRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 14,
  },
  teamRowCurrent: {
    borderColor: Palette.gold,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamBody: { flex: 1 },
  teamName: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  teamSub: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Font.extrabold,
    fontSize: 30,
    color: Palette.gold,
  },
  name: {
    marginTop: 16,
    fontFamily: Font.displayExtra,
    fontSize: 22,
    color: Palette.ink,
  },
  email: {
    marginTop: 2,
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textMuted,
  },
  providerPill: {
    marginTop: 12,
    backgroundColor: Palette.goldWash,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  providerText: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: Palette.planText,
  },
  footer: {
    paddingHorizontal: 20,
  },
  logout: {
    height: 54,
    borderRadius: 15,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontFamily: Font.extrabold,
    fontSize: 16,
    color: Palette.red,
  },
  deleteAccount: {
    marginTop: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteAccountText: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: Palette.red,
    textDecorationLine: 'underline',
  },
  dim: {
    opacity: 0.85,
  },
});
