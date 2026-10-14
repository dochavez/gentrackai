import { StyleSheet, Text, View } from 'react-native';

import { BoltIcon } from '@/components/ui/icons/bolt-icon';
import { Font, Palette } from '@/constants/design';

/** Small pill showing the current plan and usage (e.g. "Premium plan · 3 / 10 used"). */
export function PlanPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <BoltIcon size={12} color={Palette.planText} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.planBg,
    borderWidth: 1,
    borderColor: Palette.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  label: {
    fontFamily: Font.bold,
    fontSize: 12,
    color: Palette.planText,
  },
});
