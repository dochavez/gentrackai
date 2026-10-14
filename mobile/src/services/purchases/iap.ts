/**
 * In-App Purchases (StoreKit / Play Billing) through RevenueCat, addressed by
 * *offering* — Pro and the technician plan are sold as two separate offerings.
 *
 * App Store guideline 3.1.1 requires digital subscriptions to be sold with IAP,
 * so on iOS this — not Stripe Checkout — is the purchase path. Stripe stays for
 * web subscriptions and for all real-world marketplace payments, which
 * guideline 3.1.5(a) explicitly allows.
 *
 * The RevenueCat SDK is a singleton, so configuration and identity are owned by
 * `@/services/billing/store-billing` alone; configuring it a second time here
 * would overwrite the key and app user id that module just installed. The "app
 * user id" is the *organization* as the backend names it (`user.iapAppUserId`),
 * because a subscription belongs to the org rather than to one member.
 *
 * Requires a development/production build — the native module is absent in Expo
 * Go, so every entry point degrades to "unavailable" rather than throwing.
 */

import Purchases, { PURCHASES_ERROR_CODE, type PurchasesPackage } from 'react-native-purchases';

import {
  identifyStoreBilling,
  isStoreBillingSupported,
} from '@/services/billing/store-billing';

/** A purchasable plan, with the store's own localized price string. */
export type IapPackage = {
  identifier: string;
  /** Localized, store-formatted price (e.g. "$14.99") — required by Apple. */
  priceLabel: string;
  /** Store-provided renewal period, when the product declares one. */
  period: string | null;
  /** The underlying package, passed back to `purchase()`. */
  raw: PurchasesPackage;
};

export type PurchaseOutcome = 'purchased' | 'cancelled';

/** Whether store purchases can be offered on this platform/build. */
export function isIapAvailable(): boolean {
  return isStoreBillingSupported();
}

/**
 * Point the SDK at an organization. Safe to call repeatedly — `identifyStoreBilling`
 * configures on first use and only talks to the network when the id changes.
 *
 * @param appUserId The backend's `user.iapAppUserId`.
 */
export async function configurePurchases(appUserId: string): Promise<void> {
  await identifyStoreBilling(appUserId);
}

/**
 * An offering's packages, in the store's own order. Pro and the technician plan
 * are separate RevenueCat offerings, so the caller names the one it wants;
 * omitting it falls back to whichever offering is marked current.
 *
 * Returns `[]` when the offering isn't configured yet in the RevenueCat dashboard.
 */
export async function getPackages(offeringId?: string): Promise<IapPackage[]> {
  if (!isIapAvailable()) return [];

  const offerings = await Purchases.getOfferings();
  const offering = (offeringId ? offerings.all[offeringId] : null) ?? offerings.current;
  const packages = offering?.availablePackages ?? [];

  return packages.map((pkg) => ({
    identifier: pkg.identifier,
    priceLabel: pkg.product.priceString,
    period: pkg.product.subscriptionPeriod ?? null,
    raw: pkg,
  }));
}

/**
 * Runs the native purchase sheet.
 * @returns `'cancelled'` when the user dismisses it; throws on a real failure.
 */
export async function purchase(pkg: IapPackage): Promise<PurchaseOutcome> {
  try {
    await Purchases.purchasePackage(pkg.raw);
    return 'purchased';
  } catch (e) {
    if (isUserCancellation(e)) return 'cancelled';
    throw e;
  }
}

/**
 * Re-applies purchases already tied to the store account — Apple requires an
 * explicit way to do this (a reinstall or a new device has no local receipt).
 */
export async function restore(): Promise<void> {
  if (!isIapAvailable()) return;
  await Purchases.restorePurchases();
}

/** Whether the store reports any active entitlement right now. */
export async function hasActiveEntitlement(): Promise<boolean> {
  if (!isIapAvailable()) return false;

  const info = await Purchases.getCustomerInfo();
  return Object.keys(info.entitlements.active).length > 0;
}

function isUserCancellation(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  if ('userCancelled' in e && (e as { userCancelled?: boolean }).userCancelled) return true;

  return 'code' in e && (e as { code?: string }).code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}
