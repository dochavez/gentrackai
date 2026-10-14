import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { Font, Palette } from '@/constants/design';

export type TextLinkProps = {
  label: string;
  onPress: () => void;
  /** `gold` for primary links, `muted` for secondary. */
  tone?: 'gold' | 'muted';
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
};

/** Accessible, tappable text link. */
export function TextLink({ label, onPress, tone = 'gold', align = 'left', style }: TextLinkProps) {
  return (
    <Text
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.base,
        { textAlign: align, color: tone === 'gold' ? Palette.goldText : Palette.textStrong },
        style,
      ]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Font.bold,
    fontSize: 13,
  },
});
