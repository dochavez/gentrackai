/**
 * Notifications — task & maintenance alerts. Tapping a row marks it read;
 * "Mark all read" clears the unread state. Reached from the Home bell.
 * View-only: data and read mutations live in `useNotifications`.
 */

import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';
import { NotificationRow } from '@/features/notifications/components/notification-row';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { notifications, unreadCount, isLoading, read, readAll } = useNotifications();

  // Tapping a notification marks it read and, when it has a deep link, opens that
  // screen. `replace` swaps this modal for the target so it's a first-class
  // screen (not stacked on the notifications modal).
  const onPressNotification = (n: (typeof notifications)[number]) => {
    void read(n);
    if (n.link) router.replace(n.link as Href);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerRight}>
          {unreadCount > 0 ? (
            <Text style={styles.readAll} onPress={readAll} accessibilityRole="button">
              Mark all read
            </Text>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
          <Text style={styles.emptyText}>Alerts about tasks and maintenance show up here.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}>
          {notifications.map((n) => (
            <NotificationRow key={n.id} item={n} onPress={() => onPressNotification(n)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Font.displayBold,
    fontSize: 18,
    color: Palette.ink,
  },
  headerRight: { minWidth: 42, alignItems: 'flex-end' },
  readAll: { fontFamily: Font.bold, fontSize: 13, color: Palette.goldText },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 6, paddingBottom: 60 },
  emptyTitle: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  emptyText: { textAlign: 'center', fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  list: { paddingHorizontal: 20, paddingTop: 6, gap: 10 },
});
