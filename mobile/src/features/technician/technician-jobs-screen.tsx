/**
 * Technician "My jobs" — requests this provider has won. View-only; data from
 * `useTechnicianJobs`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Font, Palette } from '@/constants/design';
import { TechnicianRequestRow } from '@/features/technician/components/technician-request-row';
import { useTechnicianJobs } from '@/features/technician/hooks/use-technician-jobs';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export function TechnicianJobsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { jobs, isLoading, refresh } = useTechnicianJobs();
  useRefreshOnFocus(refresh);
  const { refreshing, onRefresh } = useRefreshControl(refresh);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>My jobs</Text>
        <Text style={styles.subtitle}>Scheduled and completed work</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <FlatList
          data={jobs}
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
          ListEmptyComponent={
            <Text style={styles.empty}>No jobs yet. Win a request to see it here.</Text>
          }
          renderItem={({ item }) => (
            <TechnicianRequestRow
              request={item}
              onPress={() =>
                router.push({ pathname: '/technician/jobs/[id]', params: { id: item.id } })
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
});
