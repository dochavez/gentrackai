/**
 * Set-a-new-password screen — the destination of the reset link emailed by the
 * backend, opened in-app via a deep link (`/reset-password?token=…&email=…`).
 * Form state/validation lives in `useResetPassword`; this composes design-system
 * atoms. `token`/`email` are read from the URL by the route and passed in.
 */

import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette, Radius } from '@/constants/design';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { useResetPassword } from '@/features/auth/hooks/use-reset-password';

type Props = { token: string; email: string };

export function ResetPasswordScreen({ token, email }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useResetPassword({ token, email });

  const goToSignIn = () => router.replace('/sign-in');

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AuthHeader
            title={form.done ? 'Password updated' : 'Set a new password'}
            subtitle={
              form.done
                ? 'You can now sign in with your new password.'
                : form.hasLink
                  ? `For ${form.email}`
                  : 'This reset link is invalid or has expired.'
            }
            style={{ paddingTop: insets.top + 20 }}
          />

          <View style={styles.form}>
            {form.done ? (
              <View style={styles.note}>
                <CheckCircleIcon size={18} />
                <Text style={styles.noteText}>Your password has been changed successfully.</Text>
              </View>
            ) : form.hasLink ? (
              <>
                <TextField
                  label="New password"
                  placeholder="Create a password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="next"
                  {...form.bind('password')}
                />
                <TextField
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={form.submit}
                  {...form.bind('confirmPassword')}
                />
              </>
            ) : (
              <Text style={styles.invalid}>
                Request a fresh reset link from the sign-in screen and try again.
              </Text>
            )}

            {form.error && <Text style={styles.error}>{form.error}</Text>}

            {form.hasLink && !form.done && (
              <Button
                label="Reset password"
                onPress={form.submit}
                loading={form.submitting}
                disabled={form.submitting}
              />
            )}

            {(form.done || !form.hasLink) && (
              <Button label="Back to sign in" onPress={goToSignIn} />
            )}

            {form.hasLink && !form.done && (
              <TextLink
                label="← Back to sign in"
                onPress={goToSignIn}
                tone="muted"
                align="center"
                style={styles.back}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 40,
    gap: 13,
  },
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
  noteText: {
    flex: 1,
    fontFamily: Font.medium,
    fontSize: 13.5,
    lineHeight: 19,
    color: Palette.greenText,
  },
  invalid: {
    fontFamily: Font.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSubtle,
  },
  error: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Palette.red,
  },
  back: {
    marginTop: 2,
    fontSize: 14,
  },
});
