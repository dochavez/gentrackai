import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import { mutate } from 'swr';
import * as Yup from 'yup';

import { useAuth } from '@/hooks/use-auth';
import { useGenerators } from '@/features/generators/hooks/use-generators';
import type { NewTaskValues } from '@/features/tasks/types';
import { createTask, TASKS_KEY } from '@/services/api/tasks';

const validationSchema = Yup.object({
  title: Yup.string().trim().required('Give the task a title.'),
  generatorId: Yup.string().nullable().required('Pick the generator this task is for.'),
});

/**
 * Owns the new-task form via Formik + Yup. The generator list, the selected
 * generator (seedable from the `generatorId` prop), the due preset, and the
 * assign-to-me flag all live in Formik values; on submit it creates the task
 * and revalidates every filtered task list. Keeps `NewTaskScreen` presentational.
 */
export function useNewTaskForm({ generatorId }: { generatorId?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { generators } = useGenerators();

  const formik = useFormik<NewTaskValues>({
    initialValues: {
      title: '',
      generatorId: generatorId ?? null,
      dueDays: null,
      assignToMe: true,
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const dueDate =
          values.dueDays != null
            ? new Date(Date.now() + values.dueDays * 86400000).toISOString().slice(0, 10)
            : null;
        await createTask({
          title: values.title.trim(),
          generator_id: values.generatorId as string,
          due_date: dueDate,
          assignee_id: values.assignToMe ? (user?.id ?? null) : null,
        });
        // Revalidate every filtered task list.
        await mutate((key) => typeof key === 'string' && key.startsWith(TASKS_KEY));
        router.back();
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not create the task.');
      }
    },
  });

  /** Props to spread onto the title `TextField`. */
  const bind = (field: 'title') => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const selectGenerator = (id: string) => formik.setFieldValue('generatorId', id);
  const selectDue = (days: number) =>
    formik.setFieldValue('dueDays', formik.values.dueDays === days ? null : days);
  const toggleAssignToMe = () => formik.setFieldValue('assignToMe', !formik.values.assignToMe);

  // Single error line: server error first, else the first validation error after a submit.
  const firstFieldError = [formik.errors.title, formik.errors.generatorId].find(Boolean);
  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? firstFieldError : undefined) ??
    null;

  return {
    generators,
    selectedGenerator: formik.values.generatorId,
    dueDays: formik.values.dueDays,
    assignToMe: formik.values.assignToMe,
    error,
    submitting: formik.isSubmitting,
    bind,
    submit: () => formik.handleSubmit(),
    selectGenerator,
    selectDue,
    toggleAssignToMe,
  };
}
