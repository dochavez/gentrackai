import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useFormik } from 'formik';
import { useState } from 'react';
import { mutate as globalMutate } from 'swr';
import * as Yup from 'yup';

import { useAuth } from '@/hooks/use-auth';
import { TECHNICIAN_KEY, becomeTechnician } from '@/services/api/technician';
import { TECHNICIAN_BILLING_KEY, createTechnicianSetupSession } from '@/services/api/technician-billing';

const validationSchema = Yup.object({
  businessName: Yup.string().trim().required('Enter your business name.'),
});

/**
 * "Become a technician": create the provider profile + service areas, then
 * capture a payment method up front (setup-mode Checkout) to unlock the trial.
 * Even if payment is skipped, the user lands in the panel (locked state) so they
 * can subscribe later. Keeps the onboarding screen presentational.
 */
export function useTechnicianOnboarding() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [serviceStates, setServiceStates] = useState<string[]>([]);

  const toggleState = (code: string) =>
    setServiceStates((prev) =>
      prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code],
    );

  const formik = useFormik<{ businessName: string }>({
    initialValues: { businessName: '' },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      if (serviceStates.length === 0) {
        helpers.setStatus('Pick at least one state you serve.');
        return;
      }
      try {
        await becomeTechnician({ businessName: values.businessName.trim(), serviceStates });
        await refreshUser();

        // Capture a payment method up front (non-fatal if cancelled).
        try {
          const returnUrl = Linking.createURL('technician-billing');
          const url = await createTechnicianSetupSession(returnUrl);
          await WebBrowser.openAuthSessionAsync(url, returnUrl);
          await refreshUser();
          await globalMutate(TECHNICIAN_KEY);
          await globalMutate(TECHNICIAN_BILLING_KEY);
        } catch {
          // ignore — the panel will show the locked (add-payment) state.
        }

        router.replace('/technician/requests');
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Could not set up your panel.');
      }
    },
  });

  const bind = (field: 'businessName') => ({
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
    serviceStates,
    toggleState,
    error,
    submitting: formik.isSubmitting,
    submit: () => formik.handleSubmit(),
  };
}
