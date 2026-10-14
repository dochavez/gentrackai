import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/services/api/user';

type Values = {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
type Field = keyof Values;

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Your name is required.'),
  state: Yup.string()
    .trim()
    .matches(/^$|^[A-Za-z]{2}$/, 'Use a 2-letter state code (e.g. CA).'),
});

/**
 * Owns the edit-profile form (name + service address). On save it PATCHes the
 * profile then refreshes the Redux-held user so `hasAddress`/`state` update
 * everywhere, and pops back. Keeps `EditProfileScreen` presentational.
 */
export function useProfileForm() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const formik = useFormik<Values>({
    initialValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      addressLine1: user?.addressLine1 ?? '',
      addressLine2: user?.addressLine2 ?? '',
      city: user?.city ?? '',
      state: user?.state ?? '',
      postalCode: user?.postalCode ?? '',
      country: user?.country ?? 'US',
    },
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        await updateUserProfile({
          name: values.name.trim(),
          phone: values.phone.trim(),
          addressLine1: values.addressLine1.trim(),
          addressLine2: values.addressLine2.trim(),
          city: values.city.trim(),
          state: values.state.trim().toUpperCase(),
          postalCode: values.postalCode.trim(),
          country: (values.country.trim() || 'US').toUpperCase(),
        });
        await refreshUser();
        router.back();
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not save your profile.');
      }
    },
  });

  const bind = (field: Field) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const setField = (field: Field, value: string) => {
    void formik.setFieldValue(field, value);
  };

  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? formik.errors.name ?? formik.errors.state : undefined) ??
    null;

  return {
    bind,
    values: formik.values,
    setField,
    error,
    submitting: formik.isSubmitting,
    submit: () => formik.handleSubmit(),
  };
}
