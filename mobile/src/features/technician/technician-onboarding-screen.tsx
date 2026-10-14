/**
 * "Become a technician" — business name + service states, then capture a
 * payment method up front. Presented as a modal. Logic in
 * `useTechnicianOnboarding`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { MultiSelectField } from '@/components/ui/multi-select-field';
import { TextField } from '@/components/ui/text-field';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { US_STATES } from '@/constants/locations';
import { Font, Palette } from '@/constants/design';
import { useTechnicianOnboarding } from '@/features/technician/hooks/use-technician-onboarding';

export function TechnicianOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bind, serviceStates, toggleState, error, submitting, submit } = useTechnicianOnboarding();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Become a technician</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>
            Receive maintenance requests near you, bid on jobs, and manage your schedule. Your first
            job is free; then it's $9.99/mo or $99.99/yr. We'll ask for a payment method to start your
            trial.
          </Text>

          <TextField label="Business name" placeholder="e.g. Bolt Generators" autoCapitalize="words" {...bind('businessName')} />

          <MultiSelectField
            label="States you serve"
            values={serviceStates}
            onToggle={toggleState}
            options={US_STATES}
            placeholder="Select states"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Continue to payment" onPress={submit} loading={submitting} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Font.displayBold, fontSize: 17, color: Palette.ink },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  lead: { fontFamily: Font.regular, fontSize: 14, color: Palette.textStrong, lineHeight: 20 },
  section: {
    marginTop: 4,
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  error: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  actions: { marginTop: 8 },
});
