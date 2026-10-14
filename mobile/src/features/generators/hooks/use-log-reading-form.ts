import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';
import * as Yup from 'yup';

import { METRICS } from '@/features/generators/constants';
import { useGenerator } from '@/features/generators/hooks/use-generators';
import type { ReadingMetric } from '@/features/generators/types';
import { GENERATORS_KEY, logReading } from '@/services/api/generators';

type Values = { value: string; note: string };

/** Validation mirrors the old checks: a required number, and fuel constrained to 0–100. */
function buildSchema(metric: ReadingMetric) {
  return Yup.object({
    value: Yup.string()
      .test('numeric', 'Enter a number.', (v) => {
        if (!v || !v.trim()) return false;
        return !Number.isNaN(Number(v.replace(',', '.')));
      })
      .test('fuel-range', 'Fuel must be between 0 and 100%.', (v) => {
        if (metric !== 'fuel') return true;
        const parsed = Number((v ?? '').replace(',', '.'));
        if (Number.isNaN(parsed)) return true; // reported by the `numeric` test
        return parsed >= 0 && parsed <= 100;
      }),
    note: Yup.string(),
  });
}

/**
 * Owns the log-reading form via Formik + Yup. The selected `metric` stays as
 * local state (it isn't a text input and drives the validation schema); value
 * and note are Formik's. Logging the reading + SWR `mutate` happen here so
 * `LogReadingScreen` stays presentational.
 */
export function useLogReadingForm(generatorId: string, initialMetric?: ReadingMetric) {
  const router = useRouter();
  const { generator } = useGenerator(generatorId);

  const [metric, setMetric] = useState<ReadingMetric>(initialMetric ?? 'fuel');

  const validationSchema = useMemo(() => buildSchema(metric), [metric]);

  const formik = useFormik<Values>({
    initialValues: { value: '', note: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      const parsed = Number(values.value.replace(',', '.'));
      try {
        await logReading(generatorId, { metric, value: parsed, note: values.note.trim() || null });
        await mutate(
          (key) =>
            typeof key === 'string' &&
            (key === GENERATORS_KEY || key.startsWith(`${GENERATORS_KEY}/${generatorId}`))
        );
        router.back();
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not log the reading.');
      }
    },
  });

  const selectMetric = (next: ReadingMetric) => {
    setMetric(next);
    // Drop any visible error when switching metric (old screen cleared it here).
    formik.setStatus(undefined);
    formik.setErrors({});
  };

  /** Props to spread onto a `TextField` for a given field. */
  const bind = (field: keyof Values) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  // Single error line: server error first, else the first validation error after a submit.
  const firstFieldError = [formik.errors.value].find(Boolean);
  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? firstFieldError : undefined) ??
    null;

  const active = METRICS.find((m) => m.key === metric)!;

  return {
    generator,
    metric,
    active,
    selectMetric,
    bind,
    submit: () => formik.handleSubmit(),
    error,
    submitting: formik.isSubmitting,
  };
}
