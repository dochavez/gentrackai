/**
 * Web stub for In-App Purchases. `react-native-purchases` has no web build, so
 * Metro picks this file and the web app keeps using Stripe Checkout — which is
 * the correct channel there anyway (no store commission, no store rules).
 */

export type IapPackage = {
  identifier: string;
  priceLabel: string;
  period: string | null;
  raw: never;
};

export type PurchaseOutcome = 'purchased' | 'cancelled';

export function isIapAvailable(): boolean {
  return false;
}

export async function configurePurchases(_appUserId: string): Promise<void> {}

export async function getPackages(_offeringId?: string): Promise<IapPackage[]> {
  return [];
}

export async function purchase(_pkg: IapPackage): Promise<PurchaseOutcome> {
  throw new Error('In-app purchases are not available on web.');
}

export async function restore(): Promise<void> {}

export async function hasActiveEntitlement(): Promise<boolean> {
  return false;
}
