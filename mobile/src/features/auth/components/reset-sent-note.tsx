import { StyleSheet, Text, View } from 'react-native';

import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette, Radius } from '@/constants/design';

/** Success note shown after a password-reset email is sent. */
export function ResetSentNote() {
  return (
    <View style={styles.note}>
      <CheckCircleIcon size={18} />
      <Text style={styles.text}>Check your inbox — we sent a reset link to your email.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: Palette.greenBg,
    borderWidth: 1,
    borderColor: Palette.greenBorder,
    borderRadius: Radius.input,
    padding: 14,
  },
  text: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13.5,
    lineHeight: 19,
    color: Palette.greenText,
  },
});
