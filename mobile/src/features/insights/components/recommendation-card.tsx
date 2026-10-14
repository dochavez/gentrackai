import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { Font, Palette } from '@/constants/design';
import { severityColors } from '@/features/insights/constants';
import type { Recommendation } from '@/features/insights/types';

/** The gold "AI recommendation" card. */
export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const c = severityColors(recommendation.severity);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <BoltIcon size={15} color={Palette.goldText} />
        <Text style={styles.kicker}>AI recommendation</Text>
        <View style={styles.spacer} />
        <Badge label={recommendation.severity.toUpperCase()} color={c.color} backgroundColor={c.bg} />
      </View>
      <Text style={styles.title}>{recommendation.title}</Text>
      <Text style={styles.body}>{recommendation.body}</Text>
      {recommendation.generatorName ? (
        <Text style={styles.generator}>{recommendation.generatorName}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: Palette.goldSoft,
    experimental_backgroundImage: 'linear-gradient(135deg, #FFF3D1, #FFE7A8)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  kicker: { fontFamily: Font.extrabold, fontSize: 13, color: Palette.planText },
  spacer: { flex: 1 },
  title: { marginTop: 10, fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  body: { marginTop: 6, fontFamily: Font.regular, fontSize: 13.5, lineHeight: 20, color: Palette.onGoldSubtitle },
  generator: { marginTop: 8, fontFamily: Font.semibold, fontSize: 12.5, color: Palette.planText },
});
