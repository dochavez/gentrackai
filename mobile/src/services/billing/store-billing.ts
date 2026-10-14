/**
 * Store billing — subscriptions bought through StoreKit (iOS) or Play Billing
 * (Android), wrapped by RevenueCat (`react-native-purchases`).
 *
 * Apple requires digital subscriptions to be sold with In-App Purchase (App
 * Store guideline 3.1.1) and Google requires Play Billing, so on native the app
 * never opens Stripe Checkout — that is what got the first submission rejected.
 * Stripe stays the channel on web only.
 *
 * The backend remains the source of truth: RevenueCat reports the purchase to it
 * (webhook), and the app nudges it with `POST /billing/iap/sync` on the way out
 * of the purchase sheet so Pro is unlocked before the screen updates.
 *
 * Identity matters here. The RevenueCat "app user id" is the *organization*
 * (`org_{id}`), because a subscription belongs to the org rather than the member
 * who paid; the backend builds that string and serves it as `user.iapAppUserId`.
 * A purchase made while RevenueCat still holds an anonymous device id cannot be
 * mapped back to an org by the webhook, so every operation here refuses to run
 * until the expected id is the active one.
 *
 * Requires a development build — purchases never work in Expo Go.
 */

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type PurchasesPackage,
} from 'react-native-purchases';

import { env } from '@/config/env';

/** The two billing intervals Pro is sold in. Mirrors `CheckoutInterval`. */
export type StorePlanInterval = 'monthly' | 'yearly';

/** A purchasable plan exactly as the store describes it. */
export type StorePlan = {
  interval: StorePlanInterval;
  /**
   * The store's own localized price, e.g. "$17.99". Apple and Google require the
   * displayed price to be the one they will actually charge, so this is rendered
   * verbatim — never a label of ours, and never recomputed.
   */
  priceLabel: string;
  /** Opaque store handle; hand it straight back to `purchasePlan`. */
  package: PurchasesPackage;
};

/** Which RevenueCat package types map onto our intervals; others are ignored. */
const INTERVAL_BY_PACKAGE_TYPE: Partial<Record<PACKAGE_TYPE, StorePlanInterval>> = {
  [PACKAGE_TYPE.MONTHLY]: 'monthly',
  [PACKAGE_TYPE.ANNUAL]: 'yearly',
};

function apiKey(): string {
  return Platform.OS === 'ios' ? env.revenueCat.iosApiKey : env.revenueCat.androidApiKey;
}

/**
 * Whether purchases on this platform must go through the store. Deliberately a
 * platform check and *not* a "is RevenueCat configured" check: a missing API key
 * must surface as a loud error, never as a silent fall back to Stripe Checkout,
 * which is the rejected flow.
 */
export function isStoreBillingSupported(): boolean {
  return Platform.OS !== 'web';
}

/**
 * Fails fast when the RevenueCat public SDK key is missing. Local runs read it
 * from `.env`; EAS builds need it in `eas.json` (`build.<profile>.env`) or as an
 * EAS environment variable, since `.env` is gitignored and not uploaded to EAS.
 */
function assertConfigured(): void {
  if (!apiKey()) {
    throw new Error(
      'In-app purchases are not configured: EXPO_PUBLIC_REVENUECAT_' +
        (Platform.OS === 'ios' ? 'IOS' : 'ANDROID') +
        '_API_KEY is empty. Local runs read it from .env; EAS builds need it in ' +
        'eas.json or as an EAS environment variable.'
    );
  }
}

/**
 * Points RevenueCat at `appUserId`, configuring the SDK on first use. Idempotent
 * and safe to call on every session/organization change — it only talks to the
 * network when the active id actually differs.
 */
export async function identifyStoreBilling(appUserId: string): Promise<void> {
  assertConfigured();

  if (!(await Purchases.isConfigured())) {
    await Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey: apiKey(), appUserID: appUserId });
    return;
  }

  if ((await Purchases.getAppUserID()) !== appUserId) {
    await Purchases.logIn(appUserId);
  }
}

/**
 * Drops the store identity on sign-out so the next user starts clean. A no-op
 * before the SDK has ever been configured, and RevenueCat rejects logging out an
 * already-anonymous id — neither is a failure worth surfacing.
 */
export async function resetStoreBillingIdentity(): Promise<void> {
  if (!apiKey() || !(await Purchases.isConfigured())) return;

  try {
    await Purchases.logOut();
  } catch {
    // already anonymous — nothing to drop
  }
}

/**
 * The plans the store is currently offering, from RevenueCat's *current*
 * offering. Throws when the offering is missing or empty, because showing a
 * price we made up instead would breach store rules — the caller surfaces the
 * error rather than falling back.
 */
export async function getStorePlans(appUserId: string): Promise<StorePlan[]> {
  await identifyStoreBilling(appUserId);

  const { current } = await Purchases.getOfferings();

  const plans = (current?.availablePackages ?? []).flatMap<StorePlan>((pkg) => {
    const interval = INTERVAL_BY_PACKAGE_TYPE[pkg.packageType];
    return interval
      ? [{ interval, priceLabel: pkg.product.priceString, package: pkg }]
      : [];
  });

  if (plans.length === 0) {
    throw new Error(
      "The store isn't offering a subscription right now. Please try again in a moment."
    );
  }

  return plans;
}

/**
 * Opens the native purchase sheet.
 * @returns `true` once the purchase is the customer's, `false` if they cancelled.
 * @throws if the purchase genuinely fails.
 */
export async function purchaseStorePlan(appUserId: string, plan: StorePlan): Promise<boolean> {
  await identifyStoreBilling(appUserId);

  try {
    await Purchases.purchasePackage(plan.package);
    return true;
  } catch (e) {
    if (hasErrorCode(e, PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)) return false;
    // Already owned (e.g. bought on another device, or a re-tap after a slow
    // sheet): nothing to buy, and the sync that follows will unlock it.
    if (hasErrorCode(e, PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR)) return true;
    throw new Error(storeErrorMessage(e));
  }
}

/**
 * Re-applies purchases already tied to the signed-in Apple/Google account. App
 * Review requires this to exist for any app selling a non-consumable or
 * subscription — a customer reinstalling must be able to get Pro back without
 * paying twice.
 */
export async function restoreStorePurchases(appUserId: string): Promise<void> {
  await identifyStoreBilling(appUserId);

  try {
    await Purchases.restorePurchases();
  } catch (e) {
    throw new Error(storeErrorMessage(e));
  }
}

/**
 * Opens the system subscription settings (App Store / Play Store), which is
 * where a store-billed subscription is cancelled or switched — our Stripe
 * billing portal has no say over it.
 */
export async function openStoreSubscriptionSettings(): Promise<void> {
  assertConfigured();

  try {
    await Purchases.showManageSubscriptions();
  } catch (e) {
    throw new Error(storeErrorMessage(e));
  }
}

/** RevenueCat rejects with a plain object carrying a `PURCHASES_ERROR_CODE`. */
function hasErrorCode(e: unknown, code: PURCHASES_ERROR_CODE): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === code;
}

function storeErrorMessage(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const { message } = e as { message?: unknown };
    if (typeof message === 'string' && message) return message;
  }
  return 'The store could not complete that. Please try again.';
}
