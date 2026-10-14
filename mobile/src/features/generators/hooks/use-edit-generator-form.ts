import { useRouter } from 'expo-router';
import { useFormik } from 'formik';
import { useMemo, useState } from 'react';
import { mutate } from 'swr';
import * as Yup from 'yup';

import { useGenerator } from '@/features/generators/hooks/use-generators';
import { pickFromGallery } from '@/lib/pick-image';
import type { EditGeneratorValues, Generator, GeneratorStatus } from '@/features/generators/types';
import {
  deleteGenerator,
  GENERATORS_KEY,
  updateGenerator,
  type ImageFile,
} from '@/services/api/generators';

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Give the generator a name.'),
  burnRate: Yup.string().test(
    'burn-rate',
    'Fuel burn rate must be between 0 and 100 %/hr.',
    (v) => {
      if (!v || !v.trim()) return true;
      const rate = Number(v.replace(',', '.'));
      return !Number.isNaN(rate) && rate >= 0 && rate <= 100;
    }
  ),
});

const EMPTY_VALUES: EditGeneratorValues = {
  name: '',
  location: '',
  status: 'running',
  burnRate: '',
  manufacturer: '',
  model_number: '',
  rated_power: '',
  fuel_type: '',
  type: '',
  serial_number: '',
  transfer_switch: '',
  service_interval: '',
};

/** Seeds the form from the loaded generator (mirrors the old prefill effect). */
function seedValues(generator: Generator): EditGeneratorValues {
  return {
    name: generator.name ?? '',
    location: generator.location ?? '',
    status: generator.status,
    burnRate: generator.fuelBurnRate != null ? String(generator.fuelBurnRate) : '',
    manufacturer: generator.manufacturer ?? '',
    model_number: generator.modelNumber ?? '',
    rated_power: generator.ratedPower ?? '',
    fuel_type: generator.fuelType ?? '',
    type: generator.type ?? '',
    serial_number: generator.serialNumber ?? '',
    transfer_switch: generator.transferSwitch ?? '',
    service_interval: generator.serviceInterval ?? '',
  };
}

/**
 * Owns the edit-generator form via Formik + Yup. `initialValues` are derived
 * from the loaded generator and picked up via `enableReinitialize` (Formik
 * deep-compares, so SWR revalidation of identical data won't clobber in-progress
 * edits). Image picking, the two-step delete, and the save/delete API calls +
 * SWR `mutate` live here so `EditGeneratorScreen` stays presentational.
 * Server/delete errors are routed through `formik.status` so the single `error`
 * line covers them all.
 */
export function useEditGeneratorForm(id: string) {
  const router = useRouter();
  const { generator, isLoading } = useGenerator(id);

  const initialValues = useMemo<EditGeneratorValues>(
    () => (generator ? seedValues(generator) : EMPTY_VALUES),
    [generator]
  );
  const [image, setImage] = useState<ImageFile | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formik = useFormik<EditGeneratorValues>({
    initialValues,
    enableReinitialize: true,
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      const rate = values.burnRate.trim() ? Number(values.burnRate.replace(',', '.')) : null;
      try {
        await updateGenerator(
          id,
          {
            name: values.name.trim(),
            location: values.location?.trim() || null,
            status: values.status,
            fuel_burn_rate: rate,
            manufacturer: values.manufacturer?.trim() || null,
            model_number: values.model_number?.trim() || null,
            rated_power: values.rated_power?.trim() || null,
            fuel_type: values.fuel_type?.trim() || null,
            type: values.type?.trim() || null,
            serial_number: values.serial_number?.trim() || null,
            transfer_switch: values.transfer_switch?.trim() || null,
            service_interval: values.service_interval?.trim() || null,
          },
          image ?? undefined
        );
        await mutate(
          (key) =>
            typeof key === 'string' &&
            (key === GENERATORS_KEY || key.startsWith(`${GENERATORS_KEY}/${id}`))
        );
        router.back();
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not save the changes.');
      }
    },
  });

  const changePhoto = async () => {
    const picked = await pickFromGallery();
    if (picked) setImage(picked);
  };

  const onDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteGenerator(id);
      await mutate(GENERATORS_KEY);
      router.dismissAll();
      router.back();
    } catch (e) {
      formik.setStatus(e instanceof Error ? e.message : 'Could not delete the generator.');
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  /** Props to spread onto a `TextField` for a given field. */
  const bind = (field: keyof EditGeneratorValues) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  // Single error line: server/delete error first, else the first validation error after a submit.
  const firstFieldError = [formik.errors.name, formik.errors.burnRate].find(Boolean);
  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? firstFieldError : undefined) ??
    null;

  const previewUri = image?.uri ?? generator?.imageUrl ?? null;

  return {
    ready: generator != null,
    isLoading,
    error,
    submitting: formik.isSubmitting,
    bind,
    submit: () => formik.handleSubmit(),
    status: formik.values.status,
    setStatus: (s: GeneratorStatus) => formik.setFieldValue('status', s),
    previewUri,
    changePhoto,
    confirmingDelete,
    deleting,
    delete: onDelete,
    cancelDelete: () => setConfirmingDelete(false),
  };
}
