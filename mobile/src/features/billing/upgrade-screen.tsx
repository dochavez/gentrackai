/**
 * Upgrade / plan screen — the app's "Choose your plan" (matches `/design`).
 * Two tiers (Free vs Pro); the Pro card is featured. Owner-only actions.
 *
 * The purchase itself is the platform's business, not this screen's: on iOS and
 * Android `useBilling` drives StoreKit / Play Billing (required by App Store
 * guideline 3.1.1) and the displayed price is the store's own; on web it drives
 * Stripe Checkout. This composes, and shows the restore path App Review requires.
 */

import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextLink } from '@/components/ui/text-link';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';
import { PlanCard } from '@/features/billing/components/plan-card';
import {
  FREE_FEATURES,
  LEGAL_URLS,
  PRO_FEATURES,
  RENEWAL_DISCLOSURE,
} from '@/features/billing/constants';
import { useBilling } from '@/features/billing/hooks/use-billing';
import type { CheckoutInterval } from '@/services/api/billing';
import { env } from '@/config/env';

/** Terms/Privacy open in an in-app browser — they carry no purchase flow. */
function openLegal(url: string) {
  void WebBrowser.openBrowserAsync(url);
}

export function UpgradeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    billing,
    isLoading,
    busy,
    error,
    notice,
    usesStoreBilling,
    isStoreManaged,
    canManageHere,
    plansLoading,
    priceLabel,
    reloadPlans,
    startCheckout,
    restore,
    manageSubscription,
  } = useBilling();
  const [interval, setInterval] = useState<CheckoutInterval>('monthly');

  const isPro = billing?.plan === 'pro';
  const canManage = billing?.canManageBilling ?? false;
  const price = priceLabel(interval);
  const priceSuffix = interval === 'monthly' ? '/ mo' : '/ yr';
  // The store failed to serve a price — offer a retry instead of a dead CTA.
  const storePriceMissing = usesStoreBilling && !price && !plansLoading;
  // Restoring is offered to every member, not just the owner: the purchase may
  // have been made on this device by whoever owns the store account.
  const showRestore = usesStoreBilling && !isPro;
  // The footer is absolutely positioned, so the scroll view has to reserve room
  // for whatever it grows to: the restore row and the legal block are optional.
  const footerRoom = 170 + (showRestore ? 40 : 0) + (isPro ? 0 : 62);
  // Where the subscription cannot be managed from this platform, say where it
  // lives rather than offering an action that would breach store rules.
  const elsewhereNote = isStoreManaged
    ? "This subscription was bought in the mobile app. Manage it in your device's subscription settings."
    : 'This subscription is billed on the web. Sign in from a browser to manage it.';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Close">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
      </View>

      {isLoading || !billing ? (
        <ActivityIndicator color={Palette.gold} style={styles.loading} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + footerRoom },
            ]}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{isPro ? "You're on Pro" : 'Choose your plan'}</Text>
            <Text style={styles.subtitle}>
              {isPro
                ? 'Thanks for supporting GenTrack — your whole team has the full toolkit.'
                : 'Start free. Upgrade anytime.'}
            </Text>

            {isPro ? (
              <PlanCard
                name="Pro"
                tagline="Unlimited fleet, team & AI"
                // No price on an active plan: a store-billed subscriber pays the
                // store's price, which we deliberately don't hold a label for.
                price="Active"
                features={PRO_FEATURES}
                featured
                current
              />
            ) : (
              <>
                <PlanCard
                  name="Free"
                  tagline="For getting started"
                  price="Free"
                  features={FREE_FEATURES}
                  current
                />

                <View style={styles.intervalRow}>
                  {(['monthly', 'yearly'] as CheckoutInterval[]).map((it) => {
                    const active = interval === it;
                    return (
                      <Text
                        key={it}
                        accessibilityRole="button"
                        onPress={() => setInterval(it)}
                        style={[styles.intervalPill, active && styles.intervalPillActive]}>
                        {it === 'monthly' ? 'Monthly' : 'Yearly'}
                      </Text>
                    );
                  })}
                </View>

                <PlanCard
                  name="Pro"
                  tagline="For growing fleets & teams"
                  price={price ?? '—'}
                  priceSuffix={price ? priceSuffix : undefined}
                  features={PRO_FEATURES}
                  featured
                  badge="MOST POPULAR"
                />

                {/*
                  The saving note is derived from the Stripe prices, so it is only
                  true on web. Store prices are set in App Store Connect and Play
                  Console and move independently — printing "save ~17%" next to a
                  store price we don't control would be a pricing claim we can't
                  stand behind.
                */}
                {!usesStoreBilling && interval === 'yearly' && billing.pro.yearlyNote ? (
                  <Text style={styles.yearlyNote}>{billing.pro.yearlyNote}</Text>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}

            {isPro ? (
              !canManage ? (
                <Text style={styles.ownerNote}>Only the organization owner can manage billing.</Text>
              ) : canManageHere ? (
                <Button
                  // Apple and Google renew their own subscriptions, so this opens
                  // the system settings rather than the Stripe portal.
                  label={isStoreManaged ? 'Manage subscription' : 'Manage billing'}
                  onPress={manageSubscription}
                  loading={busy}
                  disabled={busy}
                />
              ) : (
                <Text style={styles.ownerNote}>{elsewhereNote}</Text>
              )
            ) : (
              <>
                {canManage ? (
                  storePriceMissing ? (
                    <Button
                      label="Try again"
                      onPress={() => void reloadPlans()}
                      loading={busy}
                      disabled={busy}
                    />
                  ) : (
                    <>
                      <Button
                        label="Continue with Pro"
                        onPress={() => startCheckout(interval)}
                        loading={busy || (usesStoreBilling && plansLoading)}
                        disabled={busy || (usesStoreBilling && !price)}
                      />
                      <Pressable onPress={() => router.back()} disabled={busy} style={styles.skip}>
                        <Text style={styles.skipText}>Skip for now — explore first</Text>
                      </Pressable>
                    </>
                  )
                ) : (
                  <Text style={styles.ownerNote}>Only the organization owner can upgrade to Pro.</Text>
                )}

                {showRestore ? (
                  <Pressable
                    onPress={restore}
                    disabled={busy}
                    style={styles.restore}
                    accessibilityRole="button">
                    <Text style={styles.restoreText}>Restore purchases</Text>
                  </Pressable>
                ) : null}

                {/*
                  Required by App Store guideline 3.1.2 on any screen selling an
                  auto-renewing subscription: the renewal terms, plus working
                  links to the Terms of Use and Privacy Policy. Opened in the
                  system browser rather than an in-app one.
                */}
                <View style={styles.legal}>
                  {usesStoreBilling ? (
                    <Text style={styles.legalText}>{RENEWAL_DISCLOSURE}</Text>
                  ) : null}
                  <View style={styles.legalLinks}>
                    <Text
                      accessibilityRole="link"
                      onPress={() => Linking.openURL(LEGAL_URLS.terms)}
                      style={styles.legalLink}>
                      Terms of Use
                    </Text>
                    <Text style={styles.legalText}>·</Text>
                    <Text
                      accessibilityRole="link"
                      onPress={() => Linking.openURL(LEGAL_URLS.privacy)}
                      style={styles.legalLink}>
                      Privacy Policy
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  header: { paddingHorizontal: 20, paddingBottom: 4, flexDirection: 'row', alignItems: 'center' },
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
  loading: { marginTop: 48 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontFamily: Font.displayExtra, fontSize: 26, color: Palette.ink },
  subtitle: { marginTop: 4, fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
    marginBottom: 2,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 999,
    padding: 4,
    alignSelf: 'flex-start',
  },
  intervalPill: {
    fontFamily: Font.bold,
    fontSize: 13,
    color: Palette.textMuted,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  intervalPillActive: { backgroundColor: Palette.ink, color: Palette.white },
  yearlyNote: { marginTop: 10, fontFamily: Font.medium, fontSize: 13, color: Palette.goldText },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Palette.cream,
    borderTopWidth: 1,
    borderTopColor: Palette.hairline,
  },
  renewalNote: {
    marginTop: 10,
    fontFamily: Font.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: Palette.textMuted,
    textAlign: 'center',
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 10,
  },
  skip: { alignItems: 'center', paddingVertical: 14 },
  skipText: { fontFamily: Font.bold, fontSize: 13.5, color: Palette.textMuted },
  restore: { alignItems: 'center', paddingVertical: 12 },
  legal: { alignItems: 'center', gap: 4, paddingTop: 4 },
  legalText: { fontFamily: Font.regular, fontSize: 11, lineHeight: 15, color: Palette.textFaint, textAlign: 'center' },
  legalLinks: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legalLink: { fontFamily: Font.semibold, fontSize: 11.5, color: Palette.textSubtle, textDecorationLine: 'underline' },
  restoreText: { fontFamily: Font.bold, fontSize: 13.5, color: Palette.goldText },
  ownerNote: { textAlign: 'center', fontFamily: Font.medium, fontSize: 13.5, color: Palette.textMuted, paddingVertical: 8 },
  error: { fontFamily: Font.medium, fontSize: 13, color: Palette.red, marginBottom: 10, textAlign: 'center' },
  notice: { fontFamily: Font.medium, fontSize: 13, color: Palette.green, marginBottom: 10, textAlign: 'center' },
});
