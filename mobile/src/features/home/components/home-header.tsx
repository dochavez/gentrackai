import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BellIcon } from '@/components/ui/icons/bell-icon';
import { Font, Palette } from '@/constants/design';

/** Home greeting + title with the notification bell and user avatar. */
export function HomeHeader({
  greeting,
  title,
  initials,
  hasUnread = false,
  onBellPress,
  onAvatarPress,
}: {
  greeting: string;
  title: string;
  initials: string;
  hasUnread?: boolean;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onBellPress} style={styles.iconButton} accessibilityLabel="Notifications">
          <BellIcon size={20} />
          {hasUnread ? <View style={styles.dot} /> : null}
        </Pressable>
        <Pressable onPress={onAvatarPress} style={styles.avatar} accessibilityLabel="Account">
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    fontFamily: Font.semibold,
    fontSize: 13,
    color: Palette.textMuted,
  },
  title: {
    fontFamily: Font.displayExtra,
    fontSize: 26,
    lineHeight: 29,
    color: Palette.ink,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: Palette.alert,
    borderWidth: 2,
    borderColor: Palette.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.gold,
  },
});
