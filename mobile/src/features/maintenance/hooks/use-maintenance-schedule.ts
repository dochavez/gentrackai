import { useFormik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

import { useGenerator } from '@/features/generators/hooks/use-generators';
import { useMaintenance } from '@/features/maintenance/hooks/use-maintenance';
import { useTeam } from '@/features/team/hooks/use-team';
import { useAuth } from '@/hooks/use-auth';
import { completeMaintenance, scheduleMaintenance } from '@/services/api/maintenance';

type Values = { title: string };
type Field = keyof Values;

const validationSchema = Yup.object({
  title: Yup.string().trim().required('Give the service a name.'),
});

/** Local YYYY-MM-DD (avoids the UTC day-shift `toISOString` causes near midnight). */
function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Midnight, `days` from today. */
function daysFromToday(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Owns the maintenance screen's data + "schedule a service" form. Title is a
 * Formik field; the due date (quick-pick presets or an exact date) and the
 * assignee are local selection state (like `mode` in `useAuthForm`). Pulls the
 * org members (for the assignee picker) and the current user. Keeps
 * `MaintenanceScreen` presentational.
 */
export function useMaintenanceSchedule(generatorId: string) {
  const { generator } = useGenerator(generatorId);
  const { items, recommendedCycle, isLoading, refresh } = useMaintenance(generatorId);
  const { members } = useTeam();
  const { user } = useAuth();

  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);

  const formik = useFormik<Values>({
    initialValues: { title: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await scheduleMaintenance(generatorId, {
          title: values.title.trim(),
          due_date: dueDate ? toYmd(dueDate) : null,
          assignee_id: assigneeId,
        });
        await refresh();
        helpers.resetForm();
        setDueDate(null);
        setAssigneeId(null);
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not schedule the service.');
      }
    },
  });

  /** Set the due date from a quick-pick preset (tapping the active one clears it). */
  const selectDuePreset = (days: number) => {
    const preset = daysFromToday(days);
    setDueDate((prev) => (prev && prev.toDateString() === preset.toDateString() ? null : preset));
  };
  const presetActive = (days: number) =>
    dueDate !== null && dueDate.toDateString() === daysFromToday(days).toDateString();

  const pickDate = (date: Date) => setDueDate(date);
  const selectAssignee = (id: string | null) => setAssigneeId(id);

  /** Mark a scheduled item done with the (optional) cost paid, then refresh. */
  const complete = async (itemId: string, cost: number | null) => {
    await completeMaintenance(generatorId, itemId, { done: true, cost });
    await refresh();
  };

  /** Props to spread onto a `TextField` for a given field. */
  const bind = (field: Field) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  // Single error line: server error first, else the first validation error after a submit.
  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? formik.errors.title : undefined) ??
    null;

  return {
    generatorName: generator?.name ?? null,
    items,
    recommendedCycle,
    isLoading,
    members,
    currentUserId: user?.id ?? null,
    dueDate,
    assigneeId,
    selectDuePreset,
    presetActive,
    pickDate,
    selectAssignee,
    error,
    submitting: formik.isSubmitting,
    bind,
    submit: () => formik.handleSubmit(),
    complete,
  };
}
