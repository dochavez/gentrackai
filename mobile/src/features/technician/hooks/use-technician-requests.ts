import useSWR from 'swr';

import type { TechnicianRequest } from '@/features/technician/types';
import { TECHNICIAN_REQUESTS_KEY, technicianRequestKey } from '@/services/api/technician';

/** Open requests in the provider's service states (the feed). */
export function useTechnicianRequests() {
  const { data, isLoading, mutate } = useSWR<{ requests: TechnicianRequest[] }>(
    TECHNICIAN_REQUESTS_KEY,
  );

  return {
    requests: data?.requests ?? [],
    isLoading,
    refresh: mutate,
  };
}

/** A single feed request (with the viewer's own offer surfaced). */
export function useTechnicianRequest(id: string) {
  const { data, isLoading, mutate } = useSWR<{ request: TechnicianRequest }>(
    technicianRequestKey(id),
  );

  return {
    request: data?.request,
    isLoading,
    refresh: mutate,
  };
}
