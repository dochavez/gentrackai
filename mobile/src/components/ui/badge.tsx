import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/design';

/** Small status pill (e.g. "SOON"). Colors are passed in so callers control tone. */
export function Badge({
  label,
  color,
  backgroundColor,
}: {
  label: string;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Font.extrabold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
