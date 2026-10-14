/**
 * The In-App Purchase side of a paywall: loads an offering's packages, runs the
 * native purchase sheet, and restores previous purchases.
 *
 * Shared by the Pro paywall (`useBilling`) and the technician paywall
 * (`useTechnicianBilling`) — the two differ only by RevenueCat offering. After a
 * purchase or restore it asks the backend to re-read entitlements, so the plan
 * flips without waiting on the RevenueCat webhook.
 */

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { syncStoreSubscription } from '@/services/api/billing';
import {
  configurePurchases,
  getPackages,
  isIapAvailable,
  purchase,
  restore,
  type IapPackage,
} from '@/services/purchases/iap';

/** RevenueCat's standard package identifiers for the two billing intervals. */
const PACKAGE_IDS: Record<Interval, string> = {
  monthly: '$rc_monthly',
  yearly: '$rc_annual',
};

export type Interval = 'monthly' | 'yearly';

export function useStorePurchase(offeringId: string, onEntitlementChange: () => Promise<unknown>) {
  const { user } = useAuth();
  /** The organization the purchase belongs to, as the backend names it. */
  const appUserId = user?.iapAppUserId ?? null;

  const [packages, setPackages] = useState<IapPackage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The store is the purchase channel on native; web keeps using Stripe.
  const available = isIapAvailable() && appUserId !== null;

  useEffect(() => {
    if (!available || !appUserId) return;

    let active = true;
    void (async () => {
      try {
        await configurePurchases(appUserId);
        const loaded = await getPackages(offeringId);
        if (active) setPackages(loaded);
      } catch (e) {
        // `packages` stays empty, so the CTA has nothing to sell. Surfacing the
        // reason matters: a missing/rejected RevenueCat key looks identical to
        // an unconfigured offering otherwise.
        if (active) setError(e instanceof Error ? e.message : "Couldn't load plans from the store.");
      }
    })();

    return () => {
      active = false;
    };
  }, [available, offeringId, appUserId]);

  const packageFor = useCallback(
    (interval: Interval) =>
      packages.find((pkg) => pkg.identifier === PACKAGE_IDS[interval]) ??
      // Fall back to the store's own period when the offering uses custom
      // package identifiers instead of RevenueCat's defaults.
      packages.find((pkg) => pkg.period === (interval === 'monthly' ? 'P1M' : 'P1Y')) ??
      null,
    [packages],
  );

  /** Runs one store action, then re-reads entitlements on our side. */
  const run = async (action: () => Promise<'purchased' | 'cancelled' | void>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await action();
      if (outcome === 'cancelled') return;

      await syncStoreSubscription();
      await onEntitlementChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  return {
    available,
    busy,
    error,
    /** Localized store price for an interval, or null before the offering loads. */
    priceLabel: (interval: Interval) => packageFor(interval)?.priceLabel ?? null,
    /** Whether a purchasable package exists for this interval. */
    canBuy: (interval: Interval) => packageFor(interval) !== null,
    buy: (interval: Interval) =>
      run(async () => {
        const pkg = packageFor(interval);
        if (!pkg) throw new Error('That plan is not available right now.');
        return purchase(pkg);
      }, "Couldn't complete the purchase."),
    restorePurchases: () => run(restore, "Couldn't restore your purchases."),
  };
}
