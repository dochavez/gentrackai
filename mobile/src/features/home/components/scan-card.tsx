import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/ui/icons/chevron-right-icon';
import { ScanIcon } from '@/components/ui/icons/scan-icon';
import { Font, Palette } from '@/constants/design';

/** Prominent gold CTA card that launches the camera scan flow. */
export function ScanCard({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.decoCircle} />
      <View style={styles.row}>
        <View style={styles.iconTile}>
          <ScanIcon size={26} color={Palette.gold} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>Scan a generator</Text>
          <Text style={styles.subtitle}>Point your camera — we&apos;ll ID the model &amp; specs</Text>
        </View>
        <ChevronRightIcon size={20} color={Palette.ink} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    backgroundColor: Palette.gold,
    experimental_backgroundImage: 'linear-gradient(135deg, #FFD54A, #FFC531)',
    shadowColor: Palette.gold,
    shadowOpacity: 0.38,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.95,
  },
  decoCircle: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: Font.displayExtra,
    fontSize: 19,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: Font.regular,
    fontSize: 13,
    color: Palette.onGoldSubtitle,
  },
});
