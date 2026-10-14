import { StyleSheet, Text } from 'react-native';

import { Font, Palette } from '@/constants/design';

/** Bottom prompt that toggles between sign in and sign up. */
export function AuthModeSwitch({
  prompt,
  actionLabel,
  onPress,
}: {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <Text style={styles.row}>
      {prompt}{' '}
      <Text accessibilityRole="button" style={styles.link} onPress={onPress}>
        {actionLabel}
      </Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textSubtle,
  },
  link: {
    fontFamily: Font.extrabold,
    color: Palette.goldText,
  },
});
