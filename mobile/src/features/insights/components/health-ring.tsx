import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';
import { healthColor } from '@/features/insights/constants';

const SIZE = 108;
const STROKE = 11;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** Fleet health score as a donut ring with label + subtext. */
export function HealthRing({ score, label, subtext }: { score: number; label: string; subtext: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * C;
  const color = healthColor(pct);

  return (
    <Card style={styles.card}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={Palette.hairline} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${dash} ${C}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.outOf}>/ 100</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Fleet health score</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subtext}>{subtext}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 18 },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  score: { fontFamily: Font.displayExtra, fontSize: 30, color: Palette.ink, lineHeight: 34 },
  outOf: { fontFamily: Font.semibold, fontSize: 11, color: Palette.textMuted },
  body: { flex: 1 },
  title: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  label: { marginTop: 4, fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  subtext: { marginTop: 2, fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
});
