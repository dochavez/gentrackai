import useSWR from 'swr';

import type { MaintenanceRequest } from '@/features/maintenance-requests/types';
import { MAINTENANCE_REQUESTS_KEY } from '@/services/api/maintenance-requests';

/** The signed-in user's marketplace requests (list). */
export function useMaintenanceRequests() {
  const { data, isLoading, mutate } = useSWR<{ requests: MaintenanceRequest[] }>(
    MAINTENANCE_REQUESTS_KEY,
  );

  return {
    requests: data?.requests ?? [],
    isLoading,
    refresh: mutate,
  };
}
