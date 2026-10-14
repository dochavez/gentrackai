import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { Font, Palette } from '@/constants/design';

/** Gold gradient header: brand mark, title, and subtitle. */
export function AuthHeader({
  title,
  subtitle,
  style,
}: {
  title: string;
  subtitle: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      <BrandLogo />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Palette.gold,
    experimental_backgroundImage: `linear-gradient(170deg, ${Palette.goldTop}, ${Palette.gold})`,
    paddingHorizontal: 32,
    paddingBottom: 30,
  },
  title: {
    marginTop: 16,
    fontFamily: Font.displayExtra,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 5,
    fontFamily: Font.regular,
    fontSize: 15,
    color: Palette.onGoldSubtitle,
  },
});
