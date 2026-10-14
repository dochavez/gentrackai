/**
 * Technician feed — open requests in the provider's service states. View-only;
 * data from `useTechnicianRequests`. A locked banner appears when the panel
 * isn't unlocked (no payment method / trial used).
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Palette } from '@/constants/design';
import { TechnicianRequestRow } from '@/features/technician/components/technician-request-row';
import { useTechnicianProfile } from '@/features/technician/hooks/use-technician-profile';
import { useTechnicianRequests } from '@/features/technician/hooks/use-technician-requests';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export function TechnicianRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requests, isLoading, refresh } = useTechnicianRequests();
  const { technician, refresh: refreshProfile } = useTechnicianProfile();

  // The feed is org-scoped and non-focus-revalidating, so pull it fresh whenever
  // the tab regains focus (e.g. switching into technician mode) and on pull-down.
  const refreshAll = useCallback(
    () => Promise.all([refresh(), refreshProfile()]),
    [refresh, refreshProfile],
  );
  useRefreshOnFocus(refreshAll);
  const { refreshing, onRefresh } = useRefreshControl(refreshAll);

  const locked = technician ? !technician.panelUnlocked : false;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Requests</Text>
        <Text style={styles.subtitle}>Maintenance jobs near you</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.gold}
              colors={[Palette.gold]}
            />
          }
          ListHeaderComponent={
            locked ? (
              <Pressable style={styles.banner} onPress={() => router.push('/technician-billing')}>
                <Text style={styles.bannerTitle}>{technician?.subscriptionStatusLabel}</Text>
                <Text style={styles.bannerBody}>Tap to set up billing and keep taking jobs.</Text>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No open requests in your area right now. New requests will appear here.
            </Text>
          }
          renderItem={({ item }) => (
            <TechnicianRequestRow
              request={item}
              onPress={() =>
                router.push({ pathname: '/technician/requests/[id]', params: { id: item.id } })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontFamily: Font.displayExtra, fontSize: 26, color: Palette.ink },
  subtitle: { marginTop: 2, fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  list: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textMuted,
    lineHeight: 20,
  },
  banner: {
    backgroundColor: Palette.goldWash,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  bannerTitle: { fontFamily: Font.bold, fontSize: 14, color: Palette.planText },
  bannerBody: { marginTop: 2, fontFamily: Font.regular, fontSize: 12.5, color: Palette.planText },
});
