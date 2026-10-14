import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import type { AppNotification } from '@/features/notifications/types';

/** A single notification card; tapping it marks the notification read. */
export function NotificationRow({ item, onPress }: { item: AppNotification; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, item.unread && styles.rowUnread, pressed && styles.pressed]}>
      <View style={styles.iconTile}>
        <Text style={styles.emoji}>{item.icon}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          {item.unread ? <View style={styles.dot} /> : null}
        </View>
        {item.body ? <Text style={styles.bodyText}>{item.body}</Text> : null}
        {item.timeAgo ? <Text style={styles.time}>{item.timeAgo}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 14,
  },
  rowUnread: { borderColor: Palette.goldSoft, backgroundColor: Palette.goldTint },
  pressed: { opacity: 0.9 },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 18 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: Font.bold, fontSize: 14.5, color: Palette.ink },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: Palette.alert },
  bodyText: { marginTop: 2, fontFamily: Font.regular, fontSize: 13, lineHeight: 18, color: Palette.textMuted },
  time: { marginTop: 4, fontFamily: Font.regular, fontSize: 11.5, color: Palette.textFaint },
});
