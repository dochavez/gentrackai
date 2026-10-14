/**
 * Home ("Your fleet") — the first authenticated screen. Stats, next-up, and
 * recent activity are derived from the user's real generators (via SWR); the
 * scan card and tab FAB open the registration flow.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { CalendarIcon } from '@/components/ui/icons/calendar-icon';
import { ChevronRightIcon } from '@/components/ui/icons/chevron-right-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { SectionHeader } from '@/components/ui/section-header';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { useAppSection } from '@/hooks/use-app-section';
import { useAuth } from '@/hooks/use-auth';
import { ActivityList, type ActivityItem } from '@/features/home/components/activity-list';
import { ChatFab } from '@/features/home/components/chat-fab';
import { FleetStats, type FleetStat } from '@/features/home/components/fleet-stats';
import { HomeHeader } from '@/features/home/components/home-header';
import { NextUpCard } from '@/features/home/components/next-up-card';
import { PlanPill } from '@/features/home/components/plan-pill';
import { ScanCard } from '@/features/home/components/scan-card';
import { useGenerators } from '@/features/generators/hooks/use-generators';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { IncomingInviteCard } from '@/features/team/components/incoming-invite-card';
import { useIncomingInvitations } from '@/features/team/hooks/use-incoming-invitations';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { goToTechnician } = useAppSection();
  const { generators, refresh: refreshGenerators } = useGenerators();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();
  const {
    invitations: incomingInvites,
    busyId: inviteBusyId,
    accept: acceptInvite,
    decline: declineInvite,
    refresh: refreshInvites,
  } = useIncomingInvitations();

  const refresh = useCallback(
    () => Promise.all([refreshGenerators(), refreshNotifications(), refreshInvites()]),
    [refreshGenerators, refreshNotifications, refreshInvites]
  );
  useRefreshOnFocus(refresh);
  const { refreshing, onRefresh } = useRefreshControl(refresh);

  const firstName = user?.firstName ?? 'there';
  const initials = user?.initials ?? '';

  const total = generators.length;
  const running = generators.filter((g) => g.status === 'running').length;
  const needsCare = generators.filter((g) => g.status === 'needs_care').length;
  const uptime = total > 0 ? Math.round((running / total) * 100) : null;
  const attention = generators.find((g) => g.status === 'needs_care');

  const stats: FleetStat[] = [
    { value: String(total), label: 'Generators', color: Palette.ink },
    { value: uptime != null ? String(uptime) : '—', suffix: uptime != null ? '%' : '', label: 'Uptime', color: Palette.green },
    { value: String(needsCare), label: 'Needs care', color: needsCare > 0 ? Palette.alert : Palette.ink },
  ];

  const activity: ActivityItem[] = generators.slice(0, 3).map((g) => ({
    id: g.id,
    emoji: '📸',
    text: `${g.name} added`,
    time: g.addedAgo ?? '',
    tint: Palette.planBg,
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <HomeHeader
          greeting={`Good morning, ${firstName}`}
          title="Your fleet"
          initials={initials}
          hasUnread={unreadCount > 0}
          onBellPress={() => router.push('/notifications')}
          onAvatarPress={() => router.push('/account')}
        />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 112 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Palette.gold}
            colors={[Palette.gold]}
          />
        }>
        {incomingInvites.length > 0 ? (
          <View style={styles.invites}>
            <SectionHeader title={incomingInvites.length === 1 ? 'Team invitation' : 'Team invitations'} />
            <View style={styles.invitesList}>
              {incomingInvites.map((inv) => (
                <IncomingInviteCard
                  key={inv.id}
                  invitation={inv}
                  busy={inviteBusyId === inv.id}
                  onAccept={acceptInvite}
                  onDecline={declineInvite}
                />
              ))}
            </View>
          </View>
        ) : null}

        <PlanPill label={`${total} ${total === 1 ? 'generator' : 'generators'}`} />

        {user?.isTechnician ? (
          <Pressable
            style={styles.modeSwitch}
            onPress={goToTechnician}
            accessibilityLabel="Switch to technician mode">
            <View style={styles.modeIcon}>
              <WrenchIcon size={20} color={Palette.goldText} />
            </View>
            <View style={styles.modeBody}>
              <Text style={styles.modeTitle}>Technician mode</Text>
              <Text style={styles.modeSub}>Switch to your requests & jobs</Text>
            </View>
            <ChevronRightIcon size={18} color={Palette.textMuted} />
          </Pressable>
        ) : null}

        <Pressable
          style={styles.quickRow}
          onPress={() => router.push('/maintenance-requests')}
          accessibilityLabel="Maintenance requests">
          <View style={styles.quickIcon}>
            <CalendarIcon size={20} color={Palette.ink} />
          </View>
          <View style={styles.modeBody}>
            <Text style={styles.modeTitle}>Maintenance requests</Text>
            <Text style={styles.modeSub}>Track offers, scheduling & reviews</Text>
          </View>
          <ChevronRightIcon size={18} color={Palette.textMuted} />
        </Pressable>

        <ScanCard onPress={() => router.push('/scan')} />

        <View style={styles.stats}>
          <FleetStats stats={stats} />
        </View>

        {attention ? (
          <>
            <View style={styles.section}>
              <SectionHeader title="Next up" actionLabel="See all" onAction={() => router.navigate('/fleet')} />
            </View>
            <View style={styles.nextUp}>
              <NextUpCard
                title={attention.name}
                subtitle={`${attention.ratedPower ?? 'Generator'} · needs attention`}
                badge="CARE"
                onPress={() => router.push({ pathname: '/generators/[id]', params: { id: attention.id } })}
              />
            </View>
          </>
        ) : null}

        <View style={styles.activityHeader}>
          <SectionHeader title="Recent activity" />
        </View>
        {activity.length > 0 ? (
          <View style={styles.activity}>
            <ActivityList items={activity} />
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No activity yet — scan a generator&apos;s label to add your first one.
            </Text>
          </Card>
        )}
      </ScrollView>

      <ChatFab bottom={insets.bottom + 92} onPress={() => router.push('/chat')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(IS_TABLET ? 12 : 5),
    paddingBottom: 10,
  },
  content: {
    paddingHorizontal: wp(IS_TABLET ? 12 : 5),
    paddingTop: 8,
  },
  invites: {
    marginBottom: 18,
  },
  invitesList: {
    marginTop: 10,
    gap: 10,
  },
  modeSwitch: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.gold,
    borderRadius: 16,
    padding: 14,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeBody: { flex: 1 },
  modeTitle: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  modeSub: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  quickRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 14,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    marginTop: 18,
  },
  section: {
    marginTop: 20,
  },
  nextUp: {
    marginTop: 10,
  },
  activityHeader: {
    marginTop: 22,
  },
  activity: {
    marginTop: 10,
  },
  emptyCard: {
    marginTop: 10,
    padding: 18,
  },
  emptyText: {
    fontFamily: Font.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: Palette.textMuted,
  },
});
