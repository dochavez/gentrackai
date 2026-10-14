/**
 * Authentication state, backed by the Laravel API (Sanctum tokens).
 *
 * Email login/register/reset, Google (native ID token exchanged at
 * `/api/auth/google`) and Apple (native identity token exchanged at
 * `/api/auth/apple`) all yield a backend bearer token, kept in secure storage.
 * `restoreSession` re-fetches `/api/user` with that token on launch.
 *
 * Consumers read this through the `useAuth()` facade (`@/hooks/use-auth`); they
 * do not touch the slice, thunks, or selectors directly.
 */

import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

import {
  appleLoginRequest,
  deleteAccountRequest,
  fetchMe,
  forgotPasswordRequest,
  googleLoginRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  type RegisterAddress,
  resetPasswordRequest,
  switchOrganizationRequest,
} from '@/services/api/auth';
import { signInWithApple as nativeAppleSignIn } from '@/services/auth/apple';
import {
  signInWithGoogle as nativeGoogleSignIn,
  signOutFromGoogle,
} from '@/services/auth/google';
import { clearToken, getToken, setToken } from '@/services/auth/token-store';
import type { AppUser } from '@/types/auth';

/** `'restoring'` while the launch session-restore is in flight; `'ready'` after. */
type AuthStatus = 'restoring' | 'ready';

type AuthState = {
  user: AppUser | null;
  status: AuthStatus;
};

const initialState: AuthState = {
  user: null,
  status: 'restoring',
};

/**
 * Launch session restore: if a token is stored, re-fetch the user with it.
 * An invalid/expired token is cleared so the app starts signed out. Resolves to
 * the user (or `null`); it never rejects, so `status` always settles to ready.
 */
export const restoreSession = createAsyncThunk<AppUser | null>(
  'auth/restoreSession',
  async () => {
    const token = await getToken();
    if (!token) return null;
    try {
      return await fetchMe();
    } catch {
      await clearToken(); // token invalid/expired — start signed out
      return null;
    }
  },
);

export const signInWithEmail = createAsyncThunk<
  AppUser,
  { email: string; password: string }
>('auth/signInWithEmail', async ({ email, password }) => {
  const { token, user } = await loginRequest(email, password);
  await setToken(token);
  return user;
});

export const signUpWithEmail = createAsyncThunk<
  AppUser,
  { name: string; email: string; password: string; address?: RegisterAddress }
>('auth/signUpWithEmail', async ({ name, email, password, address }) => {
  const { token, user } = await registerRequest(name, email, password, address);
  await setToken(token);
  return user;
});

/** Resolves to `null` when the user cancels the native Google flow. */
export const signInWithGoogle = createAsyncThunk<AppUser | null>(
  'auth/signInWithGoogle',
  async () => {
    const googleUser = await nativeGoogleSignIn();
    if (!googleUser) return null; // user cancelled
    if (!googleUser.idToken) throw new Error('Google did not return an ID token.');
    const { token, user } = await googleLoginRequest(googleUser.idToken);
    await setToken(token);
    return user;
  },
);

/**
 * Sign in with Apple — required alongside Google by App Store guideline 4.8.
 * Resolves to `null` when the user cancels the native sheet.
 */
export const signInWithApple = createAsyncThunk<AppUser | null>(
  'auth/signInWithApple',
  async () => {
    const credential = await nativeAppleSignIn();
    if (!credential) return null; // user cancelled
    const { token, user } = await appleLoginRequest(
      credential.identityToken,
      credential.authorizationCode,
      credential.name,
    );
    await setToken(token);
    return user;
  },
);

export const sendPasswordReset = createAsyncThunk<void, string>(
  'auth/sendPasswordReset',
  async (email) => {
    await forgotPasswordRequest(email);
  },
);

/** Completes a reset using the token + email from the emailed deep link. */
export const resetPassword = createAsyncThunk<
  void,
  { token: string; email: string; password: string }
>('auth/resetPassword', async ({ token, email, password }) => {
  await resetPasswordRequest(token, email, password);
});

/** Re-fetches the signed-in user (e.g. after joining a different organization). */
export const refreshUser = createAsyncThunk<AppUser>('auth/refreshUser', async () => {
  return await fetchMe();
});

/** Switches the user's active organization; returns the updated user. */
export const switchOrganization = createAsyncThunk<AppUser, string>(
  'auth/switchOrganization',
  async (organizationId) => {
    return await switchOrganizationRequest(organizationId);
  },
);

export const signOut = createAsyncThunk<void>('auth/signOut', async () => {
  await logoutRequest();
  await clearToken();
  if (Platform.OS !== 'web') {
    try {
      await signOutFromGoogle();
    } catch {
      // no native Google session to clear — fine
    }
  }
});

/**
 * Permanently deletes the account (App Store 5.1.1(v)), then tears down the
 * local session exactly like sign-out. If the server delete fails the thunk
 * rejects *before* any local cleanup, so the user stays signed in and the
 * caller can show the error — the account still exists.
 */
export const deleteAccount = createAsyncThunk<void>('auth/deleteAccount', async () => {
  await deleteAccountRequest();
  await clearToken();
  if (Platform.OS !== 'web') {
    try {
      await signOutFromGoogle();
    } catch {
      // no native Google session to clear — fine
    }
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'ready';
      })
      .addCase(restoreSession.rejected, (state) => {
        state.status = 'ready';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
      })
      // A cancelled Google/Apple flow resolves to `null` — leave the user untouched.
      .addMatcher(
        isAnyOf(signInWithGoogle.fulfilled, signInWithApple.fulfilled),
        (state, action) => {
          if (action.payload) state.user = action.payload;
        },
      )
      // The remaining paths that resolve to a user all replace it wholesale.
      .addMatcher(
        isAnyOf(
          signInWithEmail.fulfilled,
          signUpWithEmail.fulfilled,
          refreshUser.fulfilled,
          switchOrganization.fulfilled,
        ),
        (state, action) => {
          state.user = action.payload;
        },
      );
  },
});

export const authReducer = authSlice.reducer;

// Selectors — kept alongside the slice so state shape stays encapsulated here.
type AuthRootState = { auth: AuthState };
export const selectUser = (state: AuthRootState) => state.auth.user;
export const selectIsRestoring = (state: AuthRootState) => state.auth.status === 'restoring';
export const selectIsSignedIn = (state: AuthRootState) => state.auth.user !== null;
