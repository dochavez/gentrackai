/**
 * Invite a teammate by email and assign a role. The backend always returns the
 * same generic confirmation, so this never reveals whether the email already
 * has an account. Presented as a modal; form logic lives in `useInviteForm`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CloseIcon } from '@/components/ui/icons/close-icon';
import { TextField } from '@/components/ui/text-field';
import { Font, Palette } from '@/constants/design';
import { RoleControl } from '@/features/team/components/role-control';
import { useInviteForm } from '@/features/team/hooks/use-invite-form';

export function InviteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const form = useInviteForm();

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Close">
          <CloseIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Invite teammate</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TextField
          label="Email address"
          placeholder="teammate@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          autoFocus
          {...form.bind('email')}
        />

        <View>
          <Text style={styles.groupLabel}>Role</Text>
          <RoleControl value={form.role} onChange={form.setRole} disabled={form.submitting} />
          <Text style={styles.hint}>
            Members see the fleet and their own work. Admins can see everything and manage the team.
          </Text>
        </View>

        {form.sentMessage ? <Text style={styles.sent}>{form.sentMessage}</Text> : null}
        {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

        <Button label="Send invitation" onPress={form.submit} loading={form.submitting} disabled={form.submitting} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: { paddingHorizontal: 20, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Font.displayBold,
    fontSize: 18,
    color: Palette.ink,
  },
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 18 },
  groupLabel: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.textMuted, marginBottom: 8 },
  hint: { marginTop: 8, fontFamily: Font.regular, fontSize: 12.5, lineHeight: 17, color: Palette.textMuted },
  sent: {
    fontFamily: Font.semibold,
    fontSize: 13.5,
    color: Palette.green,
    backgroundColor: Palette.greenBg,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red },
});
