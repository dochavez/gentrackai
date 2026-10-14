import useSWR from 'swr';

import type { MaintenanceReport, ReportPeriod } from '@/features/maintenance/types';
import { reportKey } from '@/services/api/maintenance';

/** The fleet maintenance report for a period (SWR-cached). */
export function useReport(period: ReportPeriod) {
  const { data, isLoading, error, mutate } = useSWR<MaintenanceReport>(reportKey(period));
  return {
    report: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
