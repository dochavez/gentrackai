import { useFormik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

import { useAuth } from '@/hooks/use-auth';

type Values = { password: string; confirmPassword: string };
type Field = keyof Values;

/** min 8 to match the API's `Password::min(8)` rule; confirm must match. */
const validationSchema = Yup.object({
  password: Yup.string().min(8, 'Password must be at least 8 characters.').required('Please enter a new password.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});

type Params = { token: string; email: string };

/**
 * Owns the reset-password form. `token` + `email` come from the emailed deep
 * link (the route reads them from the URL and passes them in). On success it
 * flips `done`; the screen then shows a confirmation and a way back to sign in.
 */
export function useResetPassword({ token, email }: Params) {
  const { resetPassword } = useAuth();
  const [done, setDone] = useState(false);

  const hasLink = Boolean(token && email);

  const formik = useFormik<Values>({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await resetPassword(token, email, values.password);
        setDone(true);
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      }
    },
  });

  const bind = (field: Field) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const firstFieldError = [formik.errors.password, formik.errors.confirmPassword].find(Boolean);
  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? firstFieldError : undefined) ??
    null;

  return {
    email,
    hasLink,
    done,
    error,
    submitting: formik.isSubmitting,
    bind,
    submit: () => formik.handleSubmit(),
  };
}
