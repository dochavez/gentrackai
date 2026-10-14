import type { DueOption, TaskFilterOption } from '@/features/tasks/types';

/** Task-list filter chips (counts are supplied by the backend per filter). */
export const FILTERS: TaskFilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'assigned', label: 'Assigned to me' },
  { key: 'unassigned', label: 'Unassigned' },
];

/** Quick due-date presets offered in the new-task form. */
export const DUE_OPTIONS: DueOption[] = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];
