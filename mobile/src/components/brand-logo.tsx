import { StyleSheet, View } from 'react-native';

import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { Palette, Radius } from '@/constants/design';

/** GenTrack brand mark — a dark rounded tile with a gold lightning bolt. */
export function BrandLogo({ size = 58 }: { size?: number }) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: Radius.logo }]}>
      <BoltIcon size={size * 0.47} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.ink,
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
