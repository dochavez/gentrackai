/**
 * Edit-profile screen — name + service address. Presentational; all logic in
 * `useProfileForm`. The service address is what the maintenance marketplace
 * uses to match technicians (state), so it's collected here.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddressFields } from '@/components/address-fields';
import { useProfileForm } from '@/features/account/hooks/use-profile-form';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';

export function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bind, values, setField, error, submitting, submit } = useProfileForm();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <TextField label="Name" placeholder="Your name" autoCapitalize="words" {...bind('name')} />
          <TextField
            label="Phone number"
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            {...bind('phone')}
          />

          <Text style={styles.sectionLabel}>Service address</Text>
          <Text style={styles.sectionHint}>
            Used to match you with technicians in your area when you request a maintenance.
          </Text>
          <AddressFields values={values} setField={setField} />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Save" onPress={submit} loading={submitting} />
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
  sectionLabel: {
    marginTop: 10,
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  sectionHint: {
    marginTop: -8,
    fontFamily: Font.regular,
    fontSize: 13,
    color: Palette.textSubtle,
    lineHeight: 18,
  },
  error: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  actions: { marginTop: 8 },
});
