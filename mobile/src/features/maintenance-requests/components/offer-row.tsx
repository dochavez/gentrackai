import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/ui/icons/chevron-right-icon';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { Font, Palette } from '@/constants/design';
import type { MaintenanceOffer } from '@/features/maintenance-requests/types';

type Props = {
  offer: MaintenanceOffer;
  /** Show the Accept button (request still open). */
  acceptable: boolean;
  accepting: boolean;
  onAccept: () => void;
  /** Open the provider's public profile (rating + reviews). */
  onViewProvider?: () => void;
};

/** One technician offer: provider identity + rating, price, message, accept. */
export function OfferRow({ offer, acceptable, accepting, onAccept, onViewProvider }: Props) {
  return (
    <View style={[styles.card, offer.accepted && styles.accepted]}>
      <Pressable style={styles.head} onPress={onViewProvider} disabled={!onViewProvider}>
        <View style={styles.avatar}>
          {offer.providerLogoUrl ? (
            <Image source={{ uri: offer.providerLogoUrl }} style={styles.avatarImg} />
          ) : (
            <WrenchIcon size={20} color={Palette.goldText} />
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {offer.providerName ?? 'Technician'}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {offer.ratingLabel ? `★ ${offer.ratingLabel} · ` : ''}
            {offer.jobsCompleted} {offer.jobsCompleted === 1 ? 'job' : 'jobs'} done
            {onViewProvider ? ' · View profile' : ''}
          </Text>
        </View>
        <Text style={styles.price}>{offer.priceLabel}</Text>
        {onViewProvider ? <ChevronRightIcon size={16} color={Palette.textMuted} /> : null}
      </Pressable>

      {offer.message ? <Text style={styles.message}>{offer.message}</Text> : null}

      {offer.accepted ? (
        <View style={styles.acceptedPill}>
          <Text style={styles.acceptedText}>Accepted</Text>
        </View>
      ) : acceptable ? (
        <Pressable
          style={({ pressed }) => [styles.acceptBtn, pressed && styles.dim]}
          onPress={onAccept}
          disabled={accepting}
          accessibilityLabel={`Accept ${offer.providerName ?? 'technician'} for ${offer.priceLabel}`}>
          {accepting ? (
            <ActivityIndicator color={Palette.ink} />
          ) : (
            <Text style={styles.acceptLabel}>Accept this offer</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  accepted: { borderColor: Palette.gold },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  body: { flex: 1 },
  name: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  meta: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  price: { fontFamily: Font.extrabold, fontSize: 18, color: Palette.ink },
  message: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textStrong, lineHeight: 19 },
  acceptBtn: {
    height: 46,
    borderRadius: 13,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptLabel: { fontFamily: Font.extrabold, fontSize: 15, color: Palette.ink },
  acceptedPill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldWash,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  acceptedText: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.planText },
  dim: { opacity: 0.9 },
});
