/**
 * Web stub for store billing. `react-native-purchases` fronts StoreKit and Play
 * Billing, neither of which exists in a browser, so Metro picks this file on web
 * to keep the bundle clean.
 *
 * Web keeps Stripe Checkout — the store rules that force In-App Purchase apply to
 * the iOS and Android apps, not to the site. `isStoreBillingSupported()` returns
 * false, so `useBilling` never reaches the functions that throw.
 */

import type { StorePlan, StorePlanInterval } from '@/services/billing/store-billing';

export type { StorePlan, StorePlanInterval };

export function isStoreBillingSupported(): boolean {
  return false;
}

/** No-op: the identity hook runs on every platform and web has no store identity. */
export async function identifyStoreBilling(_appUserId: string): Promise<void> {}

export async function resetStoreBillingIdentity(): Promise<void> {}

export async function getStorePlans(_appUserId: string): Promise<StorePlan[]> {
  throw new Error('In-app purchases are not available on web.');
}

export async function purchaseStorePlan(_appUserId: string, _plan: StorePlan): Promise<boolean> {
  throw new Error('In-app purchases are not available on web.');
}

export async function restoreStorePurchases(_appUserId: string): Promise<void> {
  throw new Error('In-app purchases are not available on web.');
}

export async function openStoreSubscriptionSettings(): Promise<void> {
  throw new Error('Store subscriptions are not available on web.');
}
