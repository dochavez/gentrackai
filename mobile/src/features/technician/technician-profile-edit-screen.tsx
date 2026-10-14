/**
 * Edit technician profile — logo, business name, phone, bio, service states.
 * Presented as a modal. Logic in `useTechnicianProfileForm`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { MultiSelectField } from '@/components/ui/multi-select-field';
import { TextField } from '@/components/ui/text-field';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { US_STATES } from '@/constants/locations';
import { Font, Palette, Radius } from '@/constants/design';
import { useTechnicianProfileForm } from '@/features/technician/hooks/use-technician-profile-form';

export function TechnicianProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bind, serviceStates, toggleState, logoPreview, changeLogo, error, submitting, submit } =
    useTechnicianProfileForm();

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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <View style={styles.logoRow}>
            <Pressable onPress={changeLogo} style={styles.logo} accessibilityLabel="Change logo">
              {logoPreview ? (
                <Image source={{ uri: logoPreview }} style={styles.logoImg} />
              ) : (
                <WrenchIcon size={28} color={Palette.goldText} />
              )}
            </Pressable>
            <Pressable onPress={changeLogo} accessibilityLabel="Change logo">
              <Text style={styles.logoAction}>{logoPreview ? 'Change logo' : 'Add a logo'}</Text>
            </Pressable>
          </View>

          <TextField label="Business name" placeholder="e.g. Bolt Generators" autoCapitalize="words" {...bind('businessName')} />
          <TextField label="Phone (optional)" placeholder="(555) 123-4567" keyboardType="phone-pad" {...bind('phone')} />

          <View>
            <Text style={styles.label}>Bio (optional)</Text>
            <TextInput
              placeholder="Tell customers about your experience, certifications, and what you service…"
              placeholderTextColor={Palette.placeholder}
              multiline
              style={styles.bio}
              {...bind('bio')}
            />
          </View>

          <MultiSelectField
            label="States you serve"
            values={serviceStates}
            onToggle={toggleState}
            options={US_STATES}
            placeholder="Select states"
          />

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
  logoRow: { alignItems: 'center', gap: 10 },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Palette.goldWash,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  logoAction: { fontFamily: Font.bold, fontSize: 14, color: Palette.goldText },
  label: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 6 },
  bio: {
    minHeight: 100,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    padding: 14,
    fontSize: 15,
    fontFamily: Font.regular,
    color: Palette.ink,
    textAlignVertical: 'top',
  },
  error: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  actions: { marginTop: 8 },
});
