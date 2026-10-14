import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import useSWR from 'swr';

import type { Billing } from '@/features/billing/types';
import { useAuth } from '@/hooks/use-auth';
import {
  BILLING_KEY,
  createBillingPortalSession,
  createCheckoutSession,
  syncStoreSubscription,
  type CheckoutInterval,
} from '@/services/api/billing';
import {
  getStorePlans,
  isStoreBillingSupported,
  openStoreSubscriptionSettings,
  purchaseStorePlan,
  restoreStorePurchases,
  type StorePlan,
} from '@/services/billing/store-billing';

/**
 * Billing status plus the purchase, restore and manage actions. Reads
 * `GET /billing` via SWR and keeps `UpgradeScreen` presentational.
 *
 * The payment channel depends on the platform, and not by preference:
 *
 *  - **iOS / Android** — the purchase must go through StoreKit / Play Billing
 *    (App Store guideline 3.1.1), so it runs through RevenueCat and the backend
 *    is nudged to re-read the entitlement afterwards. Prices come from the store
 *    itself; a subscription bought this way is cancelled in the *system* settings,
 *    not in the Stripe portal.
 *  - **Web** — Stripe Checkout and the Stripe billing portal, opened hosted.
 *
 * Nothing here decides what the organization owns: `GET /billing` does, and it
 * reflects both channels.
 */
export function useBilling() {
  const { user } = useAuth();
  const { data, isLoading, mutate } = useSWR<Billing>(BILLING_KEY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** True wherever a store owns the transaction — the whole native surface. */
  const usesStoreBilling = isStoreBillingSupported();
  /** The organization the purchase belongs to, as the backend names it. */
  const appUserId = user?.iapAppUserId ?? null;
  /** An existing subscription the *store* renews; the Stripe portal can't touch it. */
  const isStoreManaged = data?.source === 'app_store' || data?.source === 'play_store';
  /**
   * Whether *this* platform can act on the existing subscription. Each channel is
   * only manageable where it is billed: a store subscription in the system
   * settings, a Stripe one in the hosted portal. This is not just tidiness —
   * opening the Stripe portal from inside the app would put a payment mechanism
   * back in the app, which is exactly what guideline 3.1.1 forbids.
   */
  const canManageHere = usesStoreBilling ? isStoreManaged : !isStoreManaged;

  // Only fetch store prices where the store is the channel, and only while there
  // is still something to sell.
  const planKey: [string, string] | null =
    usesStoreBilling && appUserId && data?.plan !== 'pro' ? ['store-plans', appUserId] : null;

  const {
    data: storePlans,
    error: plansError,
    isLoading: plansFirstLoad,
    isValidating: plansValidating,
    mutate: reloadPlans,
  } = useSWR<StorePlan[]>(planKey, ([, id]: [string, string]) => getStorePlans(id));

  // The deep link Stripe's return page bounces us back to; passed to the API so
  // the hosted success/cancel URLs return here, and to the auth session so it
  // auto-closes the in-app browser once that link fires.
  const returnUrl = Linking.createURL('upgrade');

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  /** Web only — Stripe's hosted Checkout / billing portal. */
  const openHosted = async (getUrl: (returnUrl: string) => Promise<string>) => {
    const url = await getUrl(returnUrl);
    await WebBrowser.openAuthSessionAsync(url, returnUrl);
    await mutate();
  };

  /**
   * After a store purchase or restore: ask the backend to re-read the entitlement
   * from RevenueCat, then revalidate. A failed sync is not fatal — the RevenueCat
   * webhook is the authoritative feed and lands on its own — so the caller only
   * needs to know whether Pro is live yet.
   */
  const settleStorePurchase = async (): Promise<boolean> => {
    try {
      await syncStoreSubscription();
    } catch {
      // the webhook will still apply it
    }
    const next = await mutate();
    return next?.plan === 'pro';
  };

  /** The organization must be known before buying, or the entitlement is stranded. */
  const requireAppUserId = (): string => {
    if (!appUserId) {
      throw new Error('Your organization is still loading. Please try again in a moment.');
    }
    return appUserId;
  };

  return {
    billing: data,
    isLoading,
    busy,
    error: error ?? (plansError instanceof Error ? plansError.message : null),
    notice,
    /** Purchases on this platform go through the store, so no Stripe Checkout. */
    usesStoreBilling,
    isStoreManaged,
    canManageHere,
    // `isValidating` is folded in so a retry after a failed offering shows
    // feedback — SWR's `isLoading` only covers the very first attempt.
    /** Store prices are still loading; the CTA should wait for them. */
    plansLoading: plansFirstLoad || plansValidating,
    refresh: mutate,
    /** Retry after the store failed to serve its offering. */
    reloadPlans,

    /**
     * The price to display for an interval, or `null` when it isn't known yet.
     * On native this is the store's own localized string — Apple and Google
     * require the shown price to be the one they charge, so our Stripe labels are
     * never substituted there.
     */
    priceLabel: (interval: CheckoutInterval): string | null => {
      if (usesStoreBilling) {
        return storePlans?.find((plan) => plan.interval === interval)?.priceLabel ?? null;
      }
      return (interval === 'monthly' ? data?.pro.monthlyLabel : data?.pro.yearlyLabel) ?? null;
    },

    startCheckout: (interval: CheckoutInterval) =>
      run(async () => {
        if (!usesStoreBilling) {
          await openHosted((r) => createCheckoutSession(interval, r));
          return;
        }

        const plan = storePlans?.find((p) => p.interval === interval);
        if (!plan) {
          throw new Error("That plan isn't available from the store right now.");
        }

        const purchased = await purchaseStorePlan(requireAppUserId(), plan);
        if (!purchased) return; // the customer dismissed the sheet

        if (!(await settleStorePurchase())) {
          setNotice('Payment received — unlocking Pro can take a moment.');
        }
      }),

    /**
     * Re-applies a subscription already bought with the signed-in Apple/Google
     * account. App Review requires this for any app selling a subscription: a
     * reinstall must not have to pay twice.
     */
    restore: () =>
      run(async () => {
        await restoreStorePurchases(requireAppUserId());
        setNotice(
          (await settleStorePurchase())
            ? 'Pro restored.'
            : 'No previous purchase was found for this account.'
        );
      }),

    /** Cancel / switch an existing subscription, wherever it is actually billed. */
    manageSubscription: () =>
      run(async () => {
        if (!canManageHere) {
          throw new Error('This subscription has to be managed where it was bought.');
        }
        if (isStoreManaged) {
          await openStoreSubscriptionSettings();
          await mutate();
          return;
        }
        await openHosted(createBillingPortalSession);
      }),
  };
}
