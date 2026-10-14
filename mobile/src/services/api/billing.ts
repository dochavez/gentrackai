import { api, getApiErrorMessage } from '@/services/api/client';

/** SWR key for the organization's billing status. */
export const BILLING_KEY = '/billing';

export type CheckoutInterval = 'monthly' | 'yearly';

/**
 * Starts a Stripe Checkout session for Pro and returns the URL to open.
 * `returnUrl` is the app deep link Stripe should bounce back to on completion.
 */
export async function createCheckoutSession(interval: CheckoutInterval, returnUrl: string): Promise<string> {
  try {
    const { data } = await api.post<{ url: string }>('/billing/checkout', { interval, return_url: returnUrl });
    return data.url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't start checkout."));
  }
}

/**
 * Asks the backend to re-read the org's In-App Purchase entitlements from
 * RevenueCat and apply them. Called right after a store purchase or restore: the
 * RevenueCat webhook is authoritative but can land a moment later, and Pro should
 * be unlocked by the time the purchase sheet closes.
 */
export async function syncStoreSubscription(): Promise<void> {
  try {
    await api.post('/billing/iap/sync');
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't confirm your purchase."));
  }
}

/**
 * Returns a Stripe billing-portal URL for managing an existing subscription.
 * `returnUrl` is the app deep link Stripe should bounce back to on close.
 */
export async function createBillingPortalSession(returnUrl: string): Promise<string> {
  try {
    const { data } = await api.post<{ url: string }>('/billing/portal', { return_url: returnUrl });
    return data.url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't open the billing portal."));
  }
}
