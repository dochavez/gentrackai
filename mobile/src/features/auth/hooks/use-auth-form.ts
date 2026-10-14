import { useFormik } from 'formik';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';
import * as Yup from 'yup';

import { useAuth } from '@/hooks/use-auth';
import { useAppleSignInAvailable } from '@/features/auth/hooks/use-apple-sign-in-available';
import type { AuthMode } from '@/features/auth/types';
import { isAppleSignInAvailable } from '@/services/auth/apple';

type Values = {
  name: string;
  email: string;
  password: string;
  // Optional contact + service address captured at sign-up.
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
type Field = 'name' | 'email' | 'password' | 'phone';

const COPY: Record<AuthMode, { title: string; subtitle: string; cta: string }> = {
  signin: { title: 'Welcome back', subtitle: 'Sign in to your fleet', cta: 'Sign in' },
  signup: { title: 'Create account', subtitle: 'Start tracking your generators', cta: 'Create account' },
  forgot: { title: 'Reset password', subtitle: "We'll email you a reset link", cta: 'Send reset link' },
};

/** Validation differs per mode: name only on signup, password not on forgot (min 8 to match the API). */
function buildSchema(mode: AuthMode) {
  return Yup.object({
    name:
      mode === 'signup'
        ? Yup.string().trim().required('Please enter your name.')
        : Yup.string(),
    email: Yup.string().trim().email('Please enter a valid email address.').required('Please enter your email.'),
    password:
      mode === 'forgot'
        ? Yup.string()
        : mode === 'signup'
          ? Yup.string().min(8, 'Password must be at least 8 characters.').required('Please enter a password.')
          : Yup.string().required('Please enter your password.'),
  });
}

/**
 * Owns the auth form via Formik + Yup. `mode` (signin/signup/forgot) and the
 * one-off flags (reset-sent, Google/Apple loading) stay as local state; everything
 * else — values, validation, submit lifecycle — is Formik's. Keeps `AuthScreen`
 * presentational: it spreads `bind(field)` onto inputs and reads `error`.
 */
export function useAuthForm() {
  const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, sendPasswordReset } =
    useAuth();
  const appleAvailable = useAppleSignInAvailable();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [resetSent, setResetSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const isSignin = mode === 'signin';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  const validationSchema = useMemo(() => buildSchema(mode), [mode]);

  const formik = useFormik<Values>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
    validationSchema,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(undefined);
      try {
        if (isForgot) {
          await sendPasswordReset(values.email.trim());
          setResetSent(true);
        } else if (isSignup) {
          await signUpWithEmail(values.name.trim(), values.email.trim(), values.password, {
            phone: values.phone.trim(),
            addressLine1: values.addressLine1.trim(),
            addressLine2: values.addressLine2.trim(),
            city: values.city.trim(),
            state: values.state.trim().toUpperCase(),
            postalCode: values.postalCode.trim(),
            country: (values.country.trim() || 'US').toUpperCase(),
          });
        } else {
          await signInWithEmail(values.email.trim(), values.password);
        }
        // On success the auth gate (isSignedIn) redirects into the app.
      } catch (e) {
        helpers.setStatus(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      }
    },
  });

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setResetSent(false);
    // Keep typed values, drop stale validation/server errors.
    formik.setErrors({});
    formik.setStatus(undefined);
  };

  // Android hardware back: sign-up / forgot are modes on this one screen (not
  // routes), so there's nothing for the navigator to pop — back must return to
  // the sign-in mode instead of leaving the screen stuck. Subscribe once and
  // read the latest mode/handler through a ref kept fresh in an effect.
  const backRef = useRef({ mode, switchMode });
  useEffect(() => {
    backRef.current = { mode, switchMode };
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backRef.current.mode === 'signin') return false; // default (exit app)
      backRef.current.switchMode('signin');
      return true; // handled
    });
    return () => sub.remove();
  }, []);

  const submitWithGoogle = async () => {
    formik.setStatus(undefined);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      formik.setStatus(e instanceof Error ? e.message : 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const submitWithApple = async () => {
    formik.setStatus(undefined);
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch (e) {
      formik.setStatus(e instanceof Error ? e.message : 'Apple sign-in failed.');
    } finally {
      setAppleLoading(false);
    }
  };

  /** Props to spread onto a `TextField` for a given field. */
  const bind = (field: Field) => ({
    value: formik.values[field],
    onChangeText: formik.handleChange(field),
    onBlur: formik.handleBlur(field),
  });

  /** Update any field directly (used by the address selects on sign-up). */
  const setField = (field: keyof Values, value: string) => {
    void formik.setFieldValue(field, value);
  };
  // Single error line: server/social error first, else the first validation error after a submit.
  const firstFieldError = [formik.errors.name, formik.errors.email, formik.errors.password].find(Boolean);
  const error: string | null =
    (typeof formik.status === 'string' ? formik.status : undefined) ??
    (formik.submitCount > 0 ? firstFieldError : undefined) ??
    null;

  return {
    mode,
    isSignin,
    isSignup,
    isForgot,
    copy: COPY[mode],
    resetSent,
    error,
    submitting: formik.isSubmitting,
    googleLoading,
    appleLoading,
    /** iOS-only: hides the Apple button where the native flow doesn't exist. */
    appleAvailable,
    busy: formik.isSubmitting || googleLoading || appleLoading,
    bind,
    values: formik.values,
    setField,
    submit: () => formik.handleSubmit(),
    submitWithGoogle,
    submitWithApple,
    switchMode,
  };
}
