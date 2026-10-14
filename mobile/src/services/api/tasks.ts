import type { Task, TaskFilter } from '@/features/tasks/types';
import { api, getApiErrorMessage } from '@/services/api/client';

export const TASKS_KEY = '/tasks';

/** SWR key for a filtered task list. */
export function tasksKey(filter: TaskFilter): string {
  return `${TASKS_KEY}?filter=${filter}`;
}

export type CreateTaskInput = {
  title: string;
  generator_id: string;
  due_date?: string | null;
  assignee_id?: string | null;
};

export async function createTask(input: CreateTaskInput): Promise<Task> {
  try {
    const { data } = await api.post<{ task: Task }>(TASKS_KEY, input);
    return data.task;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't create the task."));
  }
}

export async function setTaskDone(id: string, done: boolean): Promise<Task> {
  try {
    const { data } = await api.patch<{ task: Task }>(`${TASKS_KEY}/${id}`, { done });
    return data.task;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't update the task."));
  }
}
