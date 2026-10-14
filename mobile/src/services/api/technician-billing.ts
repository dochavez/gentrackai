import { api, getApiErrorMessage } from '@/services/api/client';
import type { CheckoutInterval } from '@/services/api/billing';

/** SWR key for technician billing status. */
export const TECHNICIAN_BILLING_KEY = '/technician/billing';

/** Setup-mode Checkout URL to capture a payment method up front (no charge). */
export async function createTechnicianSetupSession(returnUrl: string): Promise<string> {
  try {
    const { data } = await api.post<{ url: string }>('/technician/billing/setup', {
      return_url: returnUrl,
    });
    return data.url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't start payment setup."));
  }
}

/** Hosted Checkout URL to start the technician subscription. */
export async function createTechnicianCheckoutSession(
  interval: CheckoutInterval,
  returnUrl: string,
): Promise<string> {
  try {
    const { data } = await api.post<{ url: string }>('/technician/billing/checkout', {
      interval,
      return_url: returnUrl,
    });
    return data.url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't start checkout."));
  }
}

/** Stripe billing-portal URL for the technician subscription. */
export async function createTechnicianPortalSession(returnUrl: string): Promise<string> {
  try {
    const { data } = await api.post<{ url: string }>('/technician/billing/portal', {
      return_url: returnUrl,
    });
    return data.url;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't open the billing portal."));
  }
}
