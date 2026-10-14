/**
 * A technician provider's public profile, opened from an offer — logo, business
 * name, rating, bio, service areas, and reviews. View-only.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { Font, Palette } from '@/constants/design';
import { useProviderProfile } from '@/features/maintenance-requests/hooks/use-provider-profile';

export function ProviderProfileScreen({ organizationId }: { organizationId: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, isLoading } = useProviderProfile(organizationId);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Technician</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading || !profile ? (
        <View style={styles.center}>
          {isLoading ? <ActivityIndicator color={Palette.gold} /> : <Text style={styles.muted}>Not found.</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.hero}>
            <View style={styles.logo}>
              {profile.logoUrl ? (
                <Image source={{ uri: profile.logoUrl }} style={styles.logoImg} />
              ) : (
                <WrenchIcon size={30} color={Palette.goldText} />
              )}
            </View>
            <Text style={styles.name}>{profile.businessName ?? 'Technician'}</Text>
            <Text style={styles.meta}>
              {profile.ratingLabel ? `★ ${profile.ratingLabel} (${profile.ratingsCount}) · ` : ''}
              {profile.jobsCompleted} {profile.jobsCompleted === 1 ? 'job' : 'jobs'} completed
            </Text>
          </View>

          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {profile.serviceStates.length > 0 ? (
            <>
              <Text style={styles.section}>Service areas</Text>
              <View style={styles.chips}>
                {profile.serviceStates.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{s}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <Text style={styles.section}>Reviews</Text>
          {profile.reviews.length > 0 ? (
            profile.reviews.map((r) => (
              <View key={r.id} style={styles.review}>
                <View style={styles.reviewHead}>
                  <Text style={styles.reviewStars}>{'★'.repeat(r.rating)}</Text>
                  <Text style={styles.reviewMeta}>
                    {r.authorName ?? 'Customer'}
                    {r.createdAgo ? ` · ${r.createdAgo}` : ''}
                  </Text>
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          ) : (
            <Text style={styles.muted}>No reviews yet.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  hero: { alignItems: 'center', gap: 8 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: Palette.goldWash,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  name: { fontFamily: Font.displayExtra, fontSize: 22, color: Palette.ink, textAlign: 'center' },
  meta: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted, textAlign: 'center' },
  bio: { fontFamily: Font.regular, fontSize: 14, color: Palette.textStrong, lineHeight: 20 },
  section: {
    marginTop: 4,
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
  review: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  reviewStars: { fontSize: 15, color: Palette.gold },
  reviewMeta: { fontFamily: Font.regular, fontSize: 12, color: Palette.textMuted },
  reviewComment: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textStrong, lineHeight: 19 },
  muted: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
});
