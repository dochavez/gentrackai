import { useState } from 'react';

import { useTasks } from '@/features/tasks/hooks/use-tasks';
import type { TaskFilter } from '@/features/tasks/types';
import { setTaskDone } from '@/services/api/tasks';

/**
 * Owns the tasks-list screen state: the active filter and the checkbox toggle.
 * Wraps the `useTasks` data hook so `TasksScreen` stays presentational.
 */
export function useTaskList() {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const { tasks, counts, isLoading, refresh } = useTasks(filter);

  const toggle = async (id: string, done: boolean) => {
    try {
      await setTaskDone(id, done);
      await refresh();
    } catch {
      // best effort
    }
  };

  return { tasks, counts, isLoading, filter, setFilter, toggle };
}
