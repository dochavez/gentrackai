export type TaskDueTone = 'overdue' | 'soon' | 'neutral' | 'done';
export type TaskFilter = 'all' | 'overdue' | 'assigned' | 'unassigned';

/** Matches the backend TaskResource (all display fields computed server-side). */
export type Task = {
  id: string;
  title: string;
  generatorId: string;
  generatorName: string | null;
  done: boolean;
  dueDate: string | null;
  dueLabel: string;
  dueTone: TaskDueTone;
  assigneeName: string;
  assigneeInitials: string | null;
  unassigned: boolean;
  assignedToMe: boolean;
};

export type TaskCounts = {
  all: number;
  overdue: number;
  assigned: number;
  unassigned: number;
};

/** A filter chip in the tasks list header. */
export type TaskFilterOption = { key: TaskFilter; label: string };

/** A "due in N" quick-select chip in the new-task form. */
export type DueOption = { label: string; days: number };

/** Form values owned by `useNewTaskForm` (Formik). */
export type NewTaskValues = {
  title: string;
  generatorId: string | null;
  dueDays: number | null;
  assignToMe: boolean;
};
