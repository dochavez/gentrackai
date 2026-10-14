/**
 * Technician billing — subscribe monthly/yearly or manage an existing plan.
 * Mirrors the Pro upgrade flow: In-App Purchase on iOS/Android, hosted Stripe on
 * web. On a store build there is no card to capture and "Restore purchases" is
 * offered instead. Logic in `useTechnicianBilling`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';
import { useTechnicianBilling } from '@/features/technician/hooks/use-technician-billing';

export function TechnicianBillingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    billing,
    isLoading,
    busy,
    error,
    channel,
    priceLabel,
    canSetupPayment,
    canRestore,
    restorePurchases,
    setupPayment,
    startCheckout,
    openManage,
  } = useTechnicianBilling();

  const canManage = billing?.canManageBilling ?? false;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Technician plan</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading || !billing ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>{billing.subscriptionStatusLabel}</Text>
            <Text style={styles.priceLine}>
              {priceLabel('monthly')}/mo · {priceLabel('yearly')}/yr
            </Text>
            <Text style={styles.note}>{billing.pricing.yearlyNote}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!canManage ? (
            <Text style={styles.muted}>Only an owner or admin can manage billing.</Text>
          ) : busy ? (
            <ActivityIndicator color={Palette.gold} />
          ) : canSetupPayment && !billing.paymentReady ? (
            <>
              <Button label="Add payment method" onPress={setupPayment} />
              <Text style={styles.muted}>
                No charge now — your first job is free. We keep a card on file to start your trial.
              </Text>
            </>
          ) : billing.subscribed ? (
            <Button label="Manage subscription" onPress={openManage} />
          ) : (
            <>
              <Button
                label={`Subscribe monthly · ${priceLabel('monthly')}`}
                onPress={() => startCheckout('monthly')}
              />
              <Pressable style={styles.secondary} onPress={() => startCheckout('yearly')}>
                <Text style={styles.secondaryLabel}>Subscribe yearly · {priceLabel('yearly')}</Text>
              </Pressable>
              {channel === 'store' ? (
                <>
                  <Text style={styles.muted}>
                    Your subscription renews automatically until cancelled. Manage or cancel it any
                    time in your subscription settings.
                  </Text>
                  {canRestore && (
                    <Pressable style={styles.linkBtn} onPress={restorePurchases}>
                      <Text style={styles.link}>Restore purchases</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <Pressable style={styles.linkBtn} onPress={openManage}>
                  <Text style={styles.link}>Manage payment method</Text>
                </Pressable>
              )}
            </>
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
  statusCard: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.gold,
    borderRadius: 16,
    padding: 18,
    gap: 6,
  },
  statusLabel: { fontFamily: Font.displayBold, fontSize: 17, color: Palette.ink },
  priceLine: { fontFamily: Font.semibold, fontSize: 15, color: Palette.textStrong },
  note: { fontFamily: Font.regular, fontSize: 13, color: Palette.textMuted },
  error: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  muted: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted, lineHeight: 19 },
  secondary: {
    height: 52,
    borderRadius: 15,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  linkBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
  link: { fontFamily: Font.bold, fontSize: 13.5, color: Palette.goldText, textDecorationLine: 'underline' },
});
