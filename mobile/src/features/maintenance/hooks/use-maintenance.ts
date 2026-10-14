import useSWR from 'swr';

import type { MaintenanceItem } from '@/features/maintenance/types';
import { maintenanceKey } from '@/services/api/maintenance';

export function useMaintenance(generatorId: string | undefined) {
  const { data, isLoading, mutate } = useSWR<{ items: MaintenanceItem[]; recommendedCycle: string | null }>(
    generatorId ? maintenanceKey(generatorId) : null
  );
  return {
    items: data?.items ?? [],
    recommendedCycle: data?.recommendedCycle ?? null,
    isLoading,
    refresh: mutate,
  };
}
