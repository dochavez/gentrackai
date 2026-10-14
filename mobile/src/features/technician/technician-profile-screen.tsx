/**
 * Technician profile — business identity, rating, service areas, and the
 * subscription card. View-only; data from `useTechnicianProfile`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EditIcon } from '@/components/ui/icons/edit-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { Font, Palette } from '@/constants/design';
import { SubscriptionCard } from '@/features/technician/components/subscription-card';
import { useTechnicianProfile } from '@/features/technician/hooks/use-technician-profile';
import { useAppSection } from '@/hooks/use-app-section';

export function TechnicianProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goToFleet } = useAppSection();
  const { technician, isLoading } = useTechnicianProfile();

  if (isLoading || !technician) {
    return (
      <View style={[styles.root, styles.center]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Palette.gold} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 },
        ]}>
        <View style={styles.topRow}>
          <View style={styles.logo}>
            {technician.logoUrl ? (
              <Image source={{ uri: technician.logoUrl }} style={styles.logoImg} />
            ) : (
              <WrenchIcon size={26} color={Palette.goldText} />
            )}
          </View>
          <View style={styles.topBody}>
            <Text style={styles.name} numberOfLines={2}>
              {technician.businessName ?? 'Your business'}
            </Text>
            <Text style={styles.meta}>
              {technician.ratingLabel ? `★ ${technician.ratingLabel} · ` : ''}
              {technician.jobsCompleted} {technician.jobsCompleted === 1 ? 'job' : 'jobs'} completed
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/technician-profile-edit')}
            style={styles.editBtn}
            accessibilityLabel="Edit profile">
            <EditIcon size={18} color={Palette.ink} />
          </Pressable>
        </View>

        {technician.bio ? <Text style={styles.bio}>{technician.bio}</Text> : null}

        <Text style={styles.section}>Service areas</Text>
        <View style={styles.chips}>
          {technician.serviceStates.length > 0 ? (
            technician.serviceStates.map((s) => (
              <View key={s} style={styles.chip}>
                <Text style={styles.chipText}>{s}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No states set.</Text>
          )}
        </View>

        <SubscriptionCard
          statusLabel={technician.subscriptionStatusLabel}
          unlocked={technician.panelUnlocked}
          canManage={technician.canManageBilling}
          onManage={() => router.push('/technician-billing')}
        />

        <Pressable style={styles.backToApp} onPress={goToFleet}>
          <Text style={styles.backToAppText}>Switch to Fleet</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: Palette.goldWash,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  topBody: { flex: 1 },
  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: Font.displayExtra, fontSize: 22, color: Palette.ink },
  meta: { marginTop: 2, fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted },
  bio: { fontFamily: Font.regular, fontSize: 14, color: Palette.textStrong, lineHeight: 20 },
  section: {
    marginTop: 6,
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  chipText: { fontFamily: Font.bold, fontSize: 13, color: Palette.ink },
  muted: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  backToApp: { marginTop: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  backToAppText: { fontFamily: Font.bold, fontSize: 14, color: Palette.goldText, textDecorationLine: 'underline' },
});
