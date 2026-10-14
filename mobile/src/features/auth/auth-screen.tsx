/**
 * Login / Sign up / Forgot-password screen — one screen, three modes, mirroring
 * the `/design` prototype. Form state/validation is handled by `useAuthForm`
 * (Formik + Yup); this component just composes design-system atoms and auth
 * molecules. Google and Apple both use their real native flows — App Store
 * guideline 4.8 requires Sign in with Apple alongside Google, so it is rendered
 * first and equally prominent (on iOS, where the native flow exists).
 */

import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressFields } from '@/components/address-fields';
import { Button } from '@/components/ui/button';
import { LabeledDivider } from '@/components/ui/labeled-divider';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { AuthHeader } from '@/features/auth/components/auth-header';
import { AppleButton } from '@/features/auth/components/apple-button';
import { AuthModeSwitch } from '@/features/auth/components/auth-mode-switch';
import { GoogleButton } from '@/features/auth/components/google-button';
import { ResetSentNote } from '@/features/auth/components/reset-sent-note';
import { useAuthForm } from '@/features/auth/hooks/use-auth-form';

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const form = useAuthForm();
  const { isSignin, isSignup, isForgot, copy } = form;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <AuthHeader
            title={copy.title}
            subtitle={copy.subtitle}
            style={[styles.header, { paddingTop: insets.top + 20 }]}
          />

          <View style={styles.form}>
            {isSignup && (
              <TextField
                label="Full name"
                placeholder="Alex Doyle"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
                {...form.bind('name')}
              />
            )}

            <TextField
              label="Email"
              placeholder="you@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType={isForgot ? 'done' : 'next'}
              onSubmitEditing={isForgot ? form.submit : undefined}
              {...form.bind('email')}
            />

            {isForgot && form.resetSent && <ResetSentNote />}

            {!isForgot && (
              <View>
                <TextField
                  label="Password"
                  placeholder={isSignup ? 'Create a password' : '••••••••'}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={isSignup ? 'new-password' : 'password'}
                  textContentType={isSignup ? 'newPassword' : 'password'}
                  returnKeyType="done"
                  onSubmitEditing={form.submit}
                  {...form.bind('password')}
                />
                {isSignin && (
                  <TextLink
                    label="Forgot password?"
                    onPress={() => form.switchMode('forgot')}
                    align="right"
                    style={styles.forgot}
                  />
                )}
              </View>
            )}

            {isSignup && (
              <TextField
                label="Phone number"
                placeholder="(555) 123-4567"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                {...form.bind('phone')}
              />
            )}

            {isSignup && (
              <View style={styles.addressBlock}>
                <Text style={styles.sectionLabel}>Service address</Text>
                <Text style={styles.sectionHint}>
                  Optional — needed to request maintenance. You can add or edit it later in your
                  profile.
                </Text>
                <AddressFields values={form.values} setField={form.setField} />
              </View>
            )}

            {form.error && <Text style={styles.error}>{form.error}</Text>}

            <Button
              label={copy.cta}
              onPress={form.submit}
              loading={form.submitting}
              disabled={form.busy}
            />

            {isForgot && (
              <TextLink
                label="← Back to sign in"
                onPress={() => form.switchMode('signin')}
                tone="muted"
                align="center"
                style={styles.back}
              />
            )}

            {isSignin && (
              <>
                <LabeledDivider>or continue with</LabeledDivider>
                {form.appleAvailable && (
                  <AppleButton onPress={form.submitWithApple} disabled={form.busy} />
                )}
                <GoogleButton
                  onPress={form.submitWithGoogle}
                  loading={form.googleLoading}
                  disabled={form.busy}
                />
              </>
            )}

            {isSignin && (
              <AuthModeSwitch
                prompt="Don't have an account?"
                actionLabel="Sign up"
                onPress={() => form.switchMode('signup')}
              />
            )}
            {isSignup && (
              <AuthModeSwitch
                prompt="Already have an account?"
                actionLabel="Sign in"
                onPress={() => form.switchMode('signin')}
              />
            )}

            <Text style={styles.terms}>By continuing you agree to our Terms & Privacy Policy.</Text>
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
  header: {
    paddingHorizontal: wp(IS_TABLET ? 20 : 8),
  },
  form: {
    paddingHorizontal: wp(IS_TABLET ? 22 : 6),
    paddingTop: 22,
    paddingBottom: 40,
    gap: 13,
  },
  // The two social buttons share the form's rhythm and sit level with each other.
  social: {
    gap: 13,
  },
  forgot: {
    marginTop: 8,
    fontSize: 13,
  },
  addressBlock: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  sectionHint: {
    marginTop: -6,
    fontFamily: Font.regular,
    fontSize: 12.5,
    color: Palette.textSubtle,
    lineHeight: 17,
  },
  back: {
    marginTop: 2,
    fontSize: 14,
  },
  error: {
    fontFamily: Font.medium,
    fontSize: 13,
    color: Palette.red,
  },
  terms: {
    marginTop: 4,
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: Palette.textFaint,
  },
});
