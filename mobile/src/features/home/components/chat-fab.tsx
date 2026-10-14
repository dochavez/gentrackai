import { Pressable, StyleSheet } from 'react-native';

import { ChatIcon } from '@/components/ui/icons/chat-icon';
import { Palette } from '@/constants/design';

/** Floating assistant button, pinned above the tab bar. */
export function ChatFab({ bottom = 104, onPress }: { bottom?: number; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open assistant"
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.pressed]}>
      <ChatIcon size={26} color={Palette.gold} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    zIndex: 45,
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.ink,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  pressed: {
    opacity: 0.9,
  },
});
