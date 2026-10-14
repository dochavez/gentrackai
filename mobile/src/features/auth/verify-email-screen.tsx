/**
 * "Verify your email" gate — shown to signed-in users whose email isn't verified
 * yet (email/password signups). Resend the link, re-check, or switch accounts.
 * The root navigator holds the user here until `emailVerified` flips true.
 */

import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { useVerifyEmail } from '@/features/auth/hooks/use-verify-email';

export function VerifyEmailScreen() {
  const insets = useSafeAreaInsets();
  const { email, busy, checking, sent, error, resend, check, signOut } = useVerifyEmail();

  return (
    <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <View style={styles.mark}>
          <Text style={styles.markEmoji}>✉️</Text>
        </View>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.body}>
          We sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>.{'\n'}Tap it to continue.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <Button label="I've verified — continue" onPress={check} loading={checking} />

          <Pressable onPress={resend} disabled={busy} style={styles.resend}>
            {busy ? (
              <ActivityIndicator color={Palette.goldText} />
            ) : (
              <Text style={styles.resendText}>{sent ? 'Link sent ✓ — resend' : 'Resend link'}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <Pressable onPress={signOut} style={styles.signout}>
        <Text style={styles.signoutText}>Use a different account</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream, justifyContent: 'space-between' },
  content: { alignItems: 'center', paddingTop: 40, paddingHorizontal: wp(IS_TABLET ? 22 : 6) },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  markEmoji: { fontSize: 34 },
  title: { fontFamily: Font.displayExtra, fontSize: 24, color: Palette.ink },
  body: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: Palette.textSubtle,
  },
  email: { fontFamily: Font.bold, color: Palette.ink },
  error: { marginTop: 16, fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  actions: { alignSelf: 'stretch', marginTop: 28, gap: 14 },
  resend: { height: 44, alignItems: 'center', justifyContent: 'center' },
  resendText: { fontFamily: Font.bold, fontSize: 14.5, color: Palette.goldText },
  signout: { height: 48, alignItems: 'center', justifyContent: 'center' },
  signoutText: { fontFamily: Font.bold, fontSize: 14, color: Palette.textMuted, textDecorationLine: 'underline' },
});
