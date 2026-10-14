import type { MaintenanceItem, ReportPeriod } from '@/features/maintenance/types';
import { api, getApiErrorMessage } from '@/services/api/client';

/** SWR key for a generator's maintenance schedule. */
export function maintenanceKey(generatorId: string): string {
  return `/generators/${generatorId}/maintenance`;
}

/** SWR key for the fleet maintenance report over a period. */
export function reportKey(period: ReportPeriod): string {
  return `/maintenance/report?period=${period}`;
}

/** Path (below the API base) for the report PDF — used by the share helper. */
export function reportPdfPath(period: ReportPeriod): string {
  return `/maintenance/report/pdf?period=${period}`;
}

export type ScheduleMaintenanceInput = {
  title: string;
  detail?: string | null;
  due_date?: string | null;
  assignee_id?: string | null;
};

export async function scheduleMaintenance(
  generatorId: string,
  input: ScheduleMaintenanceInput
): Promise<void> {
  try {
    await api.post(maintenanceKey(generatorId), input);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't schedule the service."));
  }
}

/** Marks a service done (with the cost paid) or reopens it. */
export async function completeMaintenance(
  generatorId: string,
  itemId: string,
  input: { done: boolean; cost?: number | null }
): Promise<MaintenanceItem> {
  try {
    const { data } = await api.patch<{ item: MaintenanceItem }>(
      `${maintenanceKey(generatorId)}/${itemId}`,
      input
    );
    return data.item;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't update the service."));
  }
}
