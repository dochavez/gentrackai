import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import { useMemo, useState } from 'react';
import { mutate as globalMutate } from 'swr';
import * as Yup from 'yup';

import { pickFromGallery } from '@/lib/pick-image';
import { TECHNICIAN_KEY, updateTechnicianProfile } from '@/services/api/technician';
import { TECHNICIAN_BILLING_KEY } from '@/services/api/technician-billing';
import type { ImageFile } from '@/services/api/upload';
import { useTechnicianProfile } from '@/features/technician/hooks/use-technician-profile';

type Values = { businessName: string; phone: string; bio: string };
type Field = keyof Values;

const validationSchema = Yup.object({
  businessName: Yup.string().trim().required('Enter your business name.'),
});

/**
 * Owns the technician profile editor (business name, phone, bio, logo, service
 * states). Seeds from the current profile; on save it PATCHes the profile,
 * revalidates the panel/billing status, and pops back. Presentational screen.
 */
export function useTechnicianProfileForm() {
  const router = useRouter();
  const { technician } = useTechnicianProfile();

  const initialValues = useMemo<Values>(
    () => ({
      businessName: technician?.businessName ?? '',
      phone: technician?.phone ?? '',
      bio: technician?.bio ?? '',
    }),
    [technician],
  );

  const [serviceStates, setServiceStates] = useState<string[] | null>(null);
  const [logo, setLogo] = useState<ImageFile | null>(null);

  // Fall back to the loaded profile's states until the user edits them.
  const states = serviceStates ?? technician?.serviceStates ?? [];

  const toggleState = (code: string) =>
    setServiceStates((prev) => {
      const base = prev ?? technician?.serviceStates ?? [];
      return base.includes(code) ? base.filter((s) => s !== code) : [...base, code];
    });

  const formik = useFormik<Values>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      if (states.length === 0) {
        helpers.setStatus('Pick at least one state you serve.');
        return;
      }
      try {
        await updateTechnicianProfile(
          {
            businessName: values.businessName.trim(),
            phone: values.phone.trim() || null,
            bio: values.bio.trim() || null,
            serviceStates: states,
          },
          logo ?? undefined,
        );
        await globalMutate(TECHNICIAN_KEY);
        await globalMutate(TECHNICIAN_BILLING_KEY);
        router.back();
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not save your profile.');
      }
    },
  });

  const changeLogo = async () => {
    const picked = await pickFromGallery();
    if (picked) setLogo(picked);
  };

  const bind = (field: Field) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? formik.errors.businessName : undefined) ??
    null;

  return {
    bind,
    serviceStates: states,
    toggleState,
    logoPreview: logo?.uri ?? technician?.logoUrl ?? null,
    changeLogo,
    error,
    submitting: formik.isSubmitting,
    submit: () => formik.handleSubmit(),
  };
}
