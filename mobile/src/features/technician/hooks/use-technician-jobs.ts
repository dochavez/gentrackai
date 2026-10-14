import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import useSWR from 'swr';

import type { TechnicianRequest } from '@/features/technician/types';
import {
  TECHNICIAN_JOBS_KEY,
  assignTechnician,
  completeJob,
  requestReview,
  scheduleJob,
  technicianJobKey,
} from '@/services/api/technician';

/** Jobs the provider has won (list). */
export function useTechnicianJobs() {
  const { data, isLoading, mutate } = useSWR<{ jobs: TechnicianRequest[] }>(TECHNICIAN_JOBS_KEY);

  return {
    jobs: data?.jobs ?? [],
    isLoading,
    refresh: mutate,
  };
}

/**
 * A single job with the technician actions (assign / schedule / complete /
 * request review). Each action revalidates this job and the jobs list.
 */
export function useTechnicianJob(id: string) {
  const { data, isLoading, mutate } = useSWR<{ job: TechnicianRequest }>(technicianJobKey(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await mutate();
      await globalMutate(TECHNICIAN_JOBS_KEY);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  return {
    job: data?.job,
    isLoading,
    busy,
    error,
    refresh: mutate,
    assign: (technicianId: string) => run(() => assignTechnician(id, technicianId)),
    schedule: (scheduledAt: string) => run(() => scheduleJob(id, scheduledAt)),
    complete: () => run(() => completeJob(id)),
    requestReview: () => run(() => requestReview(id)),
  };
}
