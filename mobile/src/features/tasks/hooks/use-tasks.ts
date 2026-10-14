import useSWR from 'swr';

import type { Task, TaskCounts, TaskFilter } from '@/features/tasks/types';
import { tasksKey } from '@/services/api/tasks';

const EMPTY_COUNTS: TaskCounts = { all: 0, overdue: 0, assigned: 0, unassigned: 0 };

export function useTasks(filter: TaskFilter) {
  const { data, isLoading, mutate } = useSWR<{ tasks: Task[]; counts: TaskCounts }>(tasksKey(filter));
  return {
    tasks: data?.tasks ?? [],
    counts: data?.counts ?? EMPTY_COUNTS,
    isLoading,
    refresh: mutate,
  };
}
