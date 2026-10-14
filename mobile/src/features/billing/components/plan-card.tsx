import { StyleSheet, Text, View } from 'react-native';

import { CheckCircleIcon } from '@/components/ui/icons/check-circle-icon';
import { Font, Palette } from '@/constants/design';

/**
 * A single plan card for the upgrade screen (matches the `/design` "Choose your
 * plan" cards). `featured` gives it the gold border + wash for the Pro tier;
 * `current` tags the org's active plan. Presentational.
 */
export function PlanCard({
  name,
  tagline,
  price,
  priceSuffix,
  features,
  featured = false,
  badge = null,
  current = false,
}: {
  name: string;
  tagline: string;
  price: string;
  priceSuffix?: string;
  features: string[];
  featured?: boolean;
  badge?: string | null;
  current?: boolean;
}) {
  return (
    <View style={[styles.card, featured && styles.cardFeatured]}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}

      <View style={styles.head}>
        <View style={styles.headBody}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
        {current ? (
          <View style={styles.currentPill}>
            <Text style={styles.currentText}>Current</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{price}</Text>
        {priceSuffix ? <Text style={styles.priceSuffix}>{priceSuffix}</Text> : null}
      </View>

      <View style={styles.features}>
        {features.map((f) => (
          <View key={f} style={styles.featureRow}>
            <CheckCircleIcon size={18} color={featured ? Palette.gold : Palette.green} />
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 20,
    padding: 18,
  },
  cardFeatured: {
    borderWidth: 1.5,
    borderColor: Palette.gold,
    backgroundColor: Palette.goldTint,
  },
  badge: {
    position: 'absolute',
    top: -11,
    right: 16,
    backgroundColor: Palette.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: Font.extrabold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    color: Palette.ink,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headBody: { flex: 1 },
  name: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  tagline: { marginTop: 2, fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
  currentPill: {
    backgroundColor: Palette.goldWash,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  currentText: { fontFamily: Font.bold, fontSize: 11.5, color: Palette.planText },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 14 },
  price: { fontFamily: Font.displayExtra, fontSize: 28, color: Palette.ink },
  priceSuffix: { fontFamily: Font.medium, fontSize: 13, color: Palette.textMuted, marginBottom: 5 },
  features: { marginTop: 14, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { flex: 1, fontFamily: Font.medium, fontSize: 14, color: Palette.textStrong },
});
