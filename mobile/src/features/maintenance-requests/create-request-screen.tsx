/**
 * Create a maintenance request (marketplace). Presented as a modal from a
 * generator. Requires a service address; renders a gate to the profile when
 * missing. Logic lives in `useCreateRequest`.
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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette, Radius } from '@/constants/design';
import { useCreateRequest } from '@/features/maintenance-requests/hooks/use-create-request';

export function CreateRequestScreen({ generatorId }: { generatorId: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { hasAddress, goToProfile, bind, error, submitting, submit } = useCreateRequest(generatorId);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Request a maintenance</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          {hasAddress ? (
            <>
              <Text style={styles.lead}>
                Describe what needs servicing. Technicians in your area will send you price offers to
                choose from.
              </Text>
              <Text style={styles.label}>What's the issue?</Text>
              <TextInput
                placeholder="e.g. Annual service, won't start, oil leak…"
                placeholderTextColor={Palette.placeholder}
                multiline
                style={styles.input}
                {...bind('detail')}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actions}>
                <Button label="Send request" onPress={submit} loading={submitting} />
              </View>
            </>
          ) : (
            <View style={styles.gate}>
              <Text style={styles.gateTitle}>Add your service address first</Text>
              <Text style={styles.gateBody}>
                We use your address to match you with technicians in your area. Add it to your profile
                to continue.
              </Text>
              <Button label="Add address" onPress={goToProfile} />
            </View>
          )}
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
  label: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted },
  input: {
    minHeight: 120,
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
  gate: {
    marginTop: 24,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  gateTitle: { fontFamily: Font.displayBold, fontSize: 17, color: Palette.ink },
  gateBody: { fontFamily: Font.regular, fontSize: 14, color: Palette.textStrong, lineHeight: 20 },
});
