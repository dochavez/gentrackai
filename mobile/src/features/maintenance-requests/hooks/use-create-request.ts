import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import { mutate as globalMutate } from 'swr';
import * as Yup from 'yup';

import { useAuth } from '@/hooks/use-auth';
import {
  MAINTENANCE_REQUESTS_KEY,
  createMaintenanceRequest,
} from '@/services/api/maintenance-requests';

type Values = { detail: string };
type Field = keyof Values;

const validationSchema = Yup.object({
  detail: Yup.string().trim().required('Describe what needs servicing.'),
});

/**
 * Owns the "request a maintenance" form. Requires a service address
 * (`user.hasAddress`, backend-computed); the screen renders a gate when it's
 * missing. On success it revalidates the list and opens the new request.
 */
export function useCreateRequest(generatorId: string) {
  const router = useRouter();
  const { user } = useAuth();

  const formik = useFormik<Values>({
    initialValues: { detail: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        const request = await createMaintenanceRequest({
          generatorId,
          detail: values.detail.trim(),
        });
        await globalMutate(MAINTENANCE_REQUESTS_KEY);
        router.replace({ pathname: '/maintenance-requests/[id]', params: { id: request.id } });
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not create the request.');
      }
    },
  });

  const bind = (field: Field) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? formik.errors.detail : undefined) ??
    null;

  return {
    hasAddress: Boolean(user?.hasAddress),
    goToProfile: () => router.replace('/edit-profile'),
    bind,
    error,
    submitting: formik.isSubmitting,
    submit: () => formik.handleSubmit(),
  };
}
