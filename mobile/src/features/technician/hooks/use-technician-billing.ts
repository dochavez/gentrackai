import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';

import { IAP_OFFERINGS } from '@/features/billing/constants';
import { useStorePurchase, type Interval } from '@/features/billing/hooks/use-store-purchase';
import { TECHNICIAN_KEY } from '@/services/api/technician';
import {
  TECHNICIAN_BILLING_KEY,
  createTechnicianCheckoutSession,
  createTechnicianPortalSession,
  createTechnicianSetupSession,
} from '@/services/api/technician-billing';
import { openStoreSubscriptions } from '@/services/purchases/manage';
import type { TechnicianBilling } from '@/features/technician/types';

/**
 * Technician billing status + the subscribe/manage actions. Mirrors `useBilling`:
 * In-App Purchase on iOS/Android (App Store guideline 3.1.1), Stripe Checkout on
 * web, and management handed back to whichever channel bills the plan.
 *
 * On a store build there is no card to capture, so the up-front Stripe
 * setup-mode Checkout is not offered — the trial simply runs and the store
 * carries the payment method once the provider subscribes.
 */
export function useTechnicianBilling() {
  const { data, isLoading, mutate } = useSWR<{ billing: TechnicianBilling }>(TECHNICIAN_BILLING_KEY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revalidate = async () => {
    await mutate();
    await globalMutate(TECHNICIAN_KEY);
  };

  const store = useStorePurchase(IAP_OFFERINGS.technician, revalidate);

  const returnUrl = Linking.createURL('technician-billing');

  const openHosted = async (getUrl: (returnUrl: string) => Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      const url = await getUrl(returnUrl);
      await WebBrowser.openAuthSessionAsync(url, returnUrl);
      await revalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const billing = data?.billing;

  // Store builds show the store's own localized price; elsewhere the backend's
  // labels (which mirror the Stripe prices) apply.
  const priceLabel = (interval: Interval) =>
    (store.available ? store.priceLabel(interval) : null) ??
    (interval === 'monthly' ? billing?.pricing.monthlyLabel : billing?.pricing.yearlyLabel) ??
    '';

  return {
    billing,
    isLoading,
    busy: busy || store.busy,
    error: error ?? store.error,
    refresh: mutate,
    channel: store.available ? ('store' as const) : ('stripe' as const),
    priceLabel,
    /** Only the Stripe path captures a card up front. */
    canSetupPayment: !store.available,
    canRestore: store.available,
    restorePurchases: store.restorePurchases,
    setupPayment: () => openHosted(createTechnicianSetupSession),
    startCheckout: (interval: Interval) =>
      store.available
        ? store.buy(interval)
        : openHosted((r) => createTechnicianCheckoutSession(interval, r)),
    openManage: () =>
      billing?.source && billing.source !== 'stripe'
        ? openStoreSubscriptions()
        : openHosted(createTechnicianPortalSession),
  };
}
