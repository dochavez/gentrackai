/**
 * "Continue with Apple" — Apple's own native button, required by App Store
 * guideline 4.8 and Apple's HIG (the mark, wording, and proportions must come
 * from `AppleAuthenticationButton`, not a custom lookalike). Sized to match the
 * outline `Button` variant so it sits level with the Google button.
 *
 * iOS-only: callers gate on `isAppleSignInAvailable()` (see `useAuthForm().appleAvailable`).
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/design';

export function AppleButton({
  onPress,
  loading = false,
  disabled = false,
}: {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    // The native button takes no disabled/loading props; block touches and dim
    // it so it behaves like the rest of the form while busy.
    <View pointerEvents={isDisabled ? 'none' : 'auto'} style={isDisabled ? styles.dimmed : undefined}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={Radius.input}
        onPress={onPress}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    // Matches the outline `Button` used for Google so the two read as equals.
    height: 52,
    width: '100%',
  },
  dimmed: {
    opacity: 0.6,
  },
});
