import { useFormik } from 'formik';
import { useState } from 'react';
import { mutate } from 'swr';
import * as Yup from 'yup';

import type { InviteRole } from '@/features/team/types';
import { inviteMember, ORGANIZATION_KEY } from '@/services/api/organization';

const validationSchema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email address.').required('Enter an email address.'),
});

/**
 * Owns the invite form (Formik + Yup) and the assignable role. On success it
 * surfaces the backend's generic confirmation (which never reveals whether the
 * email is already a user) and revalidates the team.
 */
export function useInviteForm() {
  const [role, setRole] = useState<InviteRole>('member');
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const formik = useFormik<{ email: string }>({
    initialValues: { email: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      setSentMessage(null);
      try {
        const message = await inviteMember(values.email.trim(), role);
        setSentMessage(message);
        helpers.resetForm();
        await mutate(ORGANIZATION_KEY);
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not send the invitation.');
      }
    },
  });

  const bind = (field: 'email') => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? formik.errors.email : undefined) ??
    null;

  return {
    bind,
    submit: () => formik.handleSubmit(),
    submitting: formik.isSubmitting,
    error,
    role,
    setRole,
    sentMessage,
  };
}
