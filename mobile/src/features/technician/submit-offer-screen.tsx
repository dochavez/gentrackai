/**
 * Submit (or update) an offer on a request. Presented as a modal. Logic in
 * `useSubmitOffer`.
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
import { TextField } from '@/components/ui/text-field';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette, Radius } from '@/constants/design';
import { useSubmitOffer } from '@/features/technician/hooks/use-submit-offer';

export function SubmitOfferScreen({ requestId }: { requestId: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bind, error, submitting, submit } = useSubmitOffer(requestId);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Make an offer</Text>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>
            Payment is handled off-platform — this is the price you'll quote the customer.
          </Text>

          <TextField label="Your price (USD)" placeholder="250" keyboardType="decimal-pad" {...bind('price')} />

          <Text style={styles.label}>Message (optional)</Text>
          <TextInput
            placeholder="When you can come, what's included…"
            placeholderTextColor={Palette.placeholder}
            multiline
            style={styles.input}
            {...bind('message')}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button label="Send offer" onPress={submit} loading={submitting} />
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
  label: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted },
  input: {
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
