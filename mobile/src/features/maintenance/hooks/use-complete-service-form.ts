import { useFormik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

const validationSchema = Yup.object({
  cost: Yup.string().test('cost', 'Enter a valid amount.', (v) => {
    if (!v || !v.trim()) return true;
    const n = Number(v.replace(',', '.'));
    return !Number.isNaN(n) && n >= 0;
  }),
});

/**
 * Owns the "mark a service done" flow for one schedule row via Formik + Yup:
 * the expand toggle, the optional cost field, and the submit lifecycle. On
 * success it calls `onComplete(cost)`, resets, and collapses. Keeps
 * `ScheduleRow` presentational (spreads `bind('cost')`, reads `submitting`).
 */
export function useCompleteServiceForm(onComplete: (cost: number | null) => Promise<void>) {
  const [completing, setCompleting] = useState(false);

  const formik = useFormik<{ cost: string }>({
    initialValues: { cost: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      const cost = values.cost.trim() ? Number(values.cost.replace(',', '.')) : null;
      try {
        await onComplete(cost);
        helpers.resetForm();
        setCompleting(false);
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not complete the service.');
      }
    },
  });

  const bind = (field: 'cost') => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? formik.errors.cost : undefined) ??
    null;

  return {
    completing,
    toggle: () => setCompleting((v) => !v),
    bind,
    submit: () => formik.handleSubmit(),
    submitting: formik.isSubmitting,
    error,
  };
}
