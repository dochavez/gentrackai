import { StyleSheet, View } from 'react-native';

import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { Palette } from '@/constants/design';

/** The assistant's bolt avatar (ink tile + gold bolt). */
export function AssistantAvatar({ size = 34 }: { size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <BoltIcon size={size * 0.5} color={Palette.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: Palette.ink, alignItems: 'center', justifyContent: 'center' },
});
