/**
 * The user's maintenance requests (marketplace). Tap one to view offers and
 * manage it. View-only; data from `useMaintenanceRequests`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { ChevronRightIcon } from '@/components/ui/icons/chevron-right-icon';
import { Font, Palette } from '@/constants/design';
import { useMaintenanceRequests } from '@/features/maintenance-requests/hooks/use-maintenance-requests';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export function RequestListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requests, isLoading, refresh } = useMaintenanceRequests();
  useRefreshOnFocus(refresh);
  const { refreshing, onRefresh } = useRefreshControl(refresh);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>My requests</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.gold}
              colors={[Palette.gold]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              No requests yet. Open a generator and tap “Find a technician” to request one.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => router.push({ pathname: '/maintenance-requests/[id]', params: { id: item.id } })}
              accessibilityLabel={`Request for ${item.generatorLabel ?? 'generator'}`}>
              <View style={styles.body}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.generatorName ?? item.generatorLabel ?? 'Generator'}
                </Text>
                <Text style={styles.meta}>
                  {item.statusLabel}
                  {item.status === 'open' ? ` · ${item.offersCount} ${item.offersCount === 1 ? 'offer' : 'offers'}` : ''}
                  {item.createdAgo ? ` · ${item.createdAgo}` : ''}
                </Text>
              </View>
              <ChevronRightIcon size={18} color={Palette.textMuted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  title: { fontFamily: Font.displayBold, fontSize: 17, color: Palette.ink },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textMuted,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 14,
  },
  body: { flex: 1 },
  name: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  meta: { marginTop: 2, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
});
