import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import { mutate as globalMutate } from 'swr';
import * as Yup from 'yup';

import {
  TECHNICIAN_REQUESTS_KEY,
  submitOffer,
  technicianRequestKey,
} from '@/services/api/technician';

type Values = { price: string; message: string };
type Field = keyof Values;

const validationSchema = Yup.object({
  price: Yup.number()
    .typeError('Enter a price.')
    .positive('Enter a price.')
    .required('Enter a price.'),
  message: Yup.string().max(2000),
});

/**
 * Owns the "make an offer" form. On success it revalidates the feed + this
 * request and pops back. A 402 (trial used / no payment) surfaces as the error
 * line so the tech can go subscribe.
 */
export function useSubmitOffer(requestId: string) {
  const router = useRouter();

  const formik = useFormik<Values>({
    initialValues: { price: '', message: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await submitOffer(requestId, {
          price: Number(values.price),
          message: values.message.trim() || null,
        });
        await globalMutate(TECHNICIAN_REQUESTS_KEY);
        await globalMutate(technicianRequestKey(requestId));
        router.back();
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not submit your offer.');
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
    (formik.submitCount > 0 ? formik.errors.price ?? formik.errors.message : undefined) ??
    null;

  return {
    bind,
    error,
    submitting: formik.isSubmitting,
    submit: () => formik.handleSubmit(),
  };
}
