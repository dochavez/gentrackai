import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Font, Palette } from '@/constants/design';

/** A tappable metric gauge: value + unit, label, optional caption and a "live" dot. */
export function Gauge({
  value,
  unit,
  label,
  caption,
  live = false,
  onPress,
  color = Palette.ink,
  style,
}: {
  value: string;
  unit?: string;
  label: string;
  caption?: string | null;
  live?: boolean;
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.gauge, pressed && styles.gaugePressed, style]} onPress={onPress}>
      {live ? <View style={styles.liveDot} /> : null}
      <Text style={[styles.gaugeValue, { color }]}>
        {value}
        {unit ? <Text style={styles.gaugeUnit}>{unit}</Text> : null}
      </Text>
      <Text style={styles.gaugeLabel}>{label}</Text>
      {caption ? (
        <Text style={styles.gaugeCaption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gauge: {
    flex: 1,
    backgroundColor: Palette.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    padding: 14,
    alignItems: 'center',
  },
  gaugePressed: { opacity: 0.85 },
  liveDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: Palette.green,
  },
  gaugeValue: { fontFamily: Font.displayExtra, fontSize: 22 },
  gaugeUnit: { fontFamily: Font.displayExtra, fontSize: 12 },
  gaugeLabel: { marginTop: 2, fontFamily: Font.semibold, fontSize: 11, color: Palette.textMuted },
  gaugeCaption: {
    marginTop: 3,
    fontFamily: Font.medium,
    fontSize: 9.5,
    color: Palette.textFaint,
    textAlign: 'center',
  },
});
