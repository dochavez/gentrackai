import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import useSWR from 'swr';

import type { MaintenanceRequest } from '@/features/maintenance-requests/types';
import {
  MAINTENANCE_REQUESTS_KEY,
  acceptOffer,
  cancelMaintenanceRequest,
  maintenanceRequestKey,
  submitReview,
} from '@/services/api/maintenance-requests';

/**
 * A single request with its offers, plus the customer actions (accept an offer,
 * leave a review, cancel). Each action revalidates this request and the list.
 * Keeps `RequestDetailScreen` presentational.
 */
export function useMaintenanceRequest(id: string) {
  const { data, isLoading, mutate } = useSWR<{ request: MaintenanceRequest }>(
    maintenanceRequestKey(id),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<MaintenanceRequest>) => {
    setBusy(true);
    setError(null);
    try {
      const request = await action();
      await mutate({ request }, { revalidate: false });
      await globalMutate(MAINTENANCE_REQUESTS_KEY);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    request: data?.request,
    isLoading,
    busy,
    error,
    refresh: mutate,
    accept: (offerId: string) => run(() => acceptOffer(id, offerId)),
    cancel: () => run(() => cancelMaintenanceRequest(id)),
    review: (rating: number, comment: string | null) => run(() => submitReview(id, { rating, comment })),
  };
}
