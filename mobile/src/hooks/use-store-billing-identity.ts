/**
 * Keeps RevenueCat pointed at the signed-in user's active organization.
 *
 * Store purchases are identified by organization (`user.iapAppUserId`), so this
 * runs for the whole session rather than only on the paywall: signing in, signing
 * out and switching organizations all have to move the store identity, or a
 * purchase would attach to the wrong org — or to an anonymous device id the
 * RevenueCat webhook cannot map back to one at all.
 *
 * Mounted once by `AppProviders`. A failure here is not worth interrupting the
 * app for: the paywall re-identifies before it loads prices and surfaces the
 * error there, where the user can actually see it.
 */

import { useEffect } from 'react';

import { useAuth } from '@/hooks/use-auth';
import {
  identifyStoreBilling,
  isStoreBillingSupported,
  resetStoreBillingIdentity,
} from '@/services/billing/store-billing';

export function useStoreBillingIdentity(): void {
  const { user } = useAuth();
  const appUserId = user?.iapAppUserId ?? null;

  useEffect(() => {
    if (!isStoreBillingSupported()) return;

    (async () => {
      try {
        if (appUserId) {
          await identifyStoreBilling(appUserId);
        } else {
          await resetStoreBillingIdentity();
        }
      } catch (e) {
        if (__DEV__) console.warn('[store-billing] identity not set', e);
      }
    })();
  }, [appUserId]);
}
