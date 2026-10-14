import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Font, Palette } from '@/constants/design';

/** Shows technician subscription/trial status with a manage/subscribe CTA. */
export function SubscriptionCard({
  statusLabel,
  unlocked,
  canManage,
  onManage,
}: {
  statusLabel: string;
  unlocked: boolean;
  canManage: boolean;
  onManage: () => void;
}) {
  return (
    <View style={[styles.card, !unlocked && styles.locked]}>
      <Text style={styles.label}>Subscription</Text>
      <Text style={styles.status}>{statusLabel}</Text>
      {canManage ? (
        <Button label={unlocked ? 'Manage subscription' : 'Set up billing'} onPress={onManage} />
      ) : (
        <Text style={styles.hint}>Ask an owner or admin to manage billing.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  locked: { borderColor: Palette.gold },
  label: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  status: { fontFamily: Font.semibold, fontSize: 15, color: Palette.ink },
  hint: { fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
});
