import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import type { SpecItem } from '@/features/generators/components/spec-list';
import { useGenerator } from '@/features/generators/hooks/use-generators';
import type { ReadingMetric } from '@/features/generators/types';
import { useAuth } from '@/hooks/use-auth';

/**
 * Data + navigation for the generator detail screen: loads the generator,
 * assembles the (presentation-ready) spec rows, and exposes the reading/edit/
 * maintenance/task route pushes so the screen stays view-only.
 */
export function useGeneratorDetail(id: string) {
  const router = useRouter();
  const { generator, isLoading } = useGenerator(id);
  const { user } = useAuth();

  const goBack = () => router.back();
  const openReading = (metric: ReadingMetric) =>
    router.push({ pathname: '/log-reading', params: { generatorId: id, metric } });
  const openEdit = () => router.push({ pathname: '/edit-generator', params: { id } });
  const openMaintenance = () =>
    router.push({ pathname: '/maintenance/[generatorId]', params: { generatorId: id } });
  const openTask = () => router.push({ pathname: '/new-task', params: { generatorId: id } });

  /**
   * Request an external technician (the marketplace). Requires a service address
   * (backend-computed `hasAddress`); if missing, route to the profile first.
   */
  const openRequestMaintenance = () => {
    if (!user?.hasAddress) {
      router.push('/edit-profile');
      return;
    }
    router.push({ pathname: '/request-maintenance', params: { generatorId: id } });
  };

  const specItems = useMemo<SpecItem[]>(() => {
    if (!generator) return [];
    return (
      [
        ['Manufacturer', generator.manufacturer],
        ['Rated output', generator.ratedPower],
        ['Fuel type', generator.fuelType],
        ['Type', generator.type],
        ['Serial', generator.serialNumber],
        ['Transfer switch', generator.transferSwitch],
        ['Service interval', generator.serviceInterval],
        ['Installed', generator.installedAt],
      ] as const
    )
      .filter(([, value]) => Boolean(value))
      .map(([label, value]) => ({ label, value: value as string }));
  }, [generator]);

  return {
    generator,
    isLoading,
    goBack,
    openReading,
    openEdit,
    openMaintenance,
    openRequestMaintenance,
    openTask,
    specItems,
  };
}
