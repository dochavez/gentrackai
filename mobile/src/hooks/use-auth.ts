/**
 * Public auth API for the app. Wraps the Redux auth slice (`@/store/auth-slice`)
 * so screens and hooks read session state and trigger auth actions without
 * touching thunks, `dispatch`, or selectors directly.
 *
 * Action methods await the underlying thunk and re-throw a plain `Error` on
 * failure (carrying the API's friendly message), so callers keep using
 * `try/catch` with `e instanceof Error`.
 */

import { useMemo } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteAccount,
  refreshUser,
  resetPassword,
  selectIsRestoring,
  selectIsSignedIn,
  selectUser,
  sendPasswordReset,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  switchOrganization,
} from '@/store/auth-slice';
import type { RegisterAddress } from '@/services/api/auth';
import type { AppUser } from '@/types/auth';

type UseAuth = {
  user: AppUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signInWithGoogle: () => Promise<void>;
  /** Native Sign in with Apple (iOS only); required by App Store guideline 4.8. */
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    name: string,
    email: string,
    password: string,
    address?: RegisterAddress,
  ) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  /** Complete a reset using the token + email from the emailed deep link. */
  resetPassword: (token: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Permanently delete the account (App Store 5.1.1(v)); tears down the session on success. */
  deleteAccount: () => Promise<void>;
  /** Re-fetch the signed-in user (e.g. after joining a different organization). */
  refreshUser: () => Promise<void>;
  /** Switch the user's active organization (caller should revalidate scoped data). */
  switchOrganization: (organizationId: string) => Promise<void>;
};

/**
 * A rejected thunk surfaces its error via `.unwrap()` as a serialized object,
 * not an `Error` instance. Normalize it back so `e instanceof Error` holds and
 * the friendly message from the API layer survives.
 */
function toError(cause: unknown, fallback: string): Error {
  if (cause instanceof Error) return cause;
  if (typeof cause === 'string') return new Error(cause);
  if (cause && typeof cause === 'object' && 'message' in cause) {
    const { message } = cause as { message?: unknown };
    if (typeof message === 'string') return new Error(message);
  }
  return new Error(fallback);
}

export function useAuth(): UseAuth {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectIsRestoring);
  const isSignedIn = useAppSelector(selectIsSignedIn);

  return useMemo<UseAuth>(() => {
    const run = async (action: { unwrap: () => Promise<unknown> }, fallback: string) => {
      try {
        await action.unwrap();
      } catch (cause) {
        throw toError(cause, fallback);
      }
    };

    return {
      user,
      isLoading,
      isSignedIn,

      signInWithEmail: (email, password) =>
        run(dispatch(signInWithEmail({ email, password })), 'Could not sign in.'),

      signUpWithEmail: (name, email, password, address) =>
        run(dispatch(signUpWithEmail({ name, email, password, address })), 'Could not create your account.'),

      signInWithGoogle: () =>
        run(dispatch(signInWithGoogle()), 'Google sign-in failed.'),

      signInWithApple: () =>
        run(dispatch(signInWithApple()), 'Apple sign-in failed.'),

      sendPasswordReset: (email) =>
        run(dispatch(sendPasswordReset(email)), 'Could not send the reset link.'),

      resetPassword: (token, email, password) =>
        run(dispatch(resetPassword({ token, email, password })), 'Could not reset your password.'),

      refreshUser: () => run(dispatch(refreshUser()), 'Could not load your account.'),

      switchOrganization: (organizationId) =>
        run(dispatch(switchOrganization(organizationId)), 'Could not switch organization.'),

      signOut: () => run(dispatch(signOut()), 'Could not sign out.'),

      deleteAccount: () => run(dispatch(deleteAccount()), 'Could not delete your account.'),
    };
  }, [dispatch, user, isLoading, isSignedIn]);
}
