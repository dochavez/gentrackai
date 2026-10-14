import useSWR from 'swr';

import type { TechnicianStatus } from '@/features/technician/types';
import { TECHNICIAN_KEY } from '@/services/api/technician';

/**
 * Technician-panel status: whether the active org is a provider, subscription/
 * trial state, service areas, and the backend-computed `panelUnlocked` gate.
 */
export function useTechnicianProfile() {
  const { data, isLoading, mutate } = useSWR<{ technician: TechnicianStatus }>(TECHNICIAN_KEY);

  return {
    technician: data?.technician,
    isLoading,
    refresh: mutate,
  };
}
