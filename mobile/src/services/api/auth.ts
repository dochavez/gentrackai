/**
 * Auth endpoints against the Laravel backend (Sanctum personal access tokens).
 * Contract verified against gentrackai-api:
 *   POST /api/register        { name, email, password, password_confirmation, device_name? } -> 201 { user, token }
 *   POST /api/login           { email, password, device_name? }                              -> 200 { user, token }
 *   POST /api/auth/google     { id_token, device_name? }                                     -> 200 { user, token }
 *   POST /api/auth/apple      { identity_token, authorization_code?, name?, device_name? }   -> 200 { user, token }
 *   POST /api/forgot-password { email }                                                      -> 200 { message }
 *   POST /api/reset-password  { token, email, password, password_confirmation }              -> 200 { message }
 *   GET  /api/user            (Bearer)                                                       -> 200 { user }
 *   POST /api/logout          (Bearer)                                                       -> 204
 *   DELETE /api/user          (Bearer)                                                       -> 204
 * The backend's UserResource already returns the `AppUser` shape, so `user`
 * needs no mapping.
 */

import type { AppUser } from '@/types/auth';
import { api, getApiErrorMessage } from '@/services/api/client';

const ENDPOINTS = {
  register: '/register',
  login: '/login',
  google: '/auth/google',
  apple: '/auth/apple',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  resendVerification: '/email/verification-notification',
  me: '/user',
  logout: '/logout',
  deleteAccount: '/user',
} as const;

const DEVICE_NAME = 'mobile';

type AuthPayload = { user: AppUser; token: string };

export type AuthResult = { token: string; user: AppUser };

export async function loginRequest(email: string, password: string): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthPayload>(ENDPOINTS.login, {
      email,
      password,
      device_name: DEVICE_NAME,
    });
    return { token: data.token, user: data.user };
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not sign in. Check your email and password.'));
  }
}

/** Optional contact + service address captured at sign-up (all fields optional). */
export type RegisterAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
};

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  address?: RegisterAddress,
): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthPayload>(ENDPOINTS.register, {
      name,
      email,
      password,
      password_confirmation: password,
      device_name: DEVICE_NAME,
      // Only send address fields that were filled in.
      address_line1: address?.addressLine1 || undefined,
      address_line2: address?.addressLine2 || undefined,
      city: address?.city || undefined,
      state: address?.state || undefined,
      postal_code: address?.postalCode || undefined,
      country: address?.country || undefined,
      phone: address?.phone || undefined,
    });
    return { token: data.token, user: data.user };
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not create your account.'));
  }
}

/** Exchanges a Google ID token (from the native flow) for a backend session. */
export async function googleLoginRequest(idToken: string): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthPayload>(ENDPOINTS.google, {
      id_token: idToken,
      device_name: DEVICE_NAME,
    });
    return { token: data.token, user: data.user };
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not sign in with Google.'));
  }
}

/**
 * Exchanges an Apple identity token (from the native flow) for a backend
 * session. `name` is only ever available on the user's *first* authorization,
 * so it is forwarded when present and ignored by the API otherwise;
 * `authorizationCode` lets the backend revoke the Apple grant on account
 * deletion (guideline 5.1.1(v)). The email always comes from the token itself.
 */
export async function appleLoginRequest(
  identityToken: string,
  authorizationCode: string | null,
  name: string | null,
): Promise<AuthResult> {
  try {
    const { data } = await api.post<AuthPayload>(ENDPOINTS.apple, {
      identity_token: identityToken,
      authorization_code: authorizationCode,
      name,
      device_name: DEVICE_NAME,
    });
    return { token: data.token, user: data.user };
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not sign in with Apple.'));
  }
}

/** Resends the email-verification link to the signed-in user. */
export async function resendVerificationEmail(): Promise<void> {
  try {
    await api.post(ENDPOINTS.resendVerification);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't resend the verification link."));
  }
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  try {
    await api.post(ENDPOINTS.forgotPassword, { email });
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not send the reset link.'));
  }
}

/**
 * Sets a new password using the `token` + `email` from the emailed reset link.
 * The backend requires the confirmation field, so it's sent alongside.
 */
export async function resetPasswordRequest(token: string, email: string, password: string): Promise<void> {
  try {
    await api.post(ENDPOINTS.resetPassword, {
      token,
      email,
      password,
      password_confirmation: password,
    });
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not reset your password. The link may have expired.'));
  }
}

/** Switches the user's active organization to another they belong to. */
export async function switchOrganizationRequest(organizationId: string): Promise<AppUser> {
  try {
    const { data } = await api.post<{ user: AppUser }>('/organization/switch', {
      organization_id: organizationId,
    });
    return data.user;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not switch organization.'));
  }
}

/** Fetches the current user using the stored bearer token. */
export async function fetchMe(): Promise<AppUser> {
  try {
    const { data } = await api.get<{ user: AppUser }>(ENDPOINTS.me);
    return data.user;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not load your account.'));
  }
}

/** Revokes the current token server-side (best effort). */
export async function logoutRequest(): Promise<void> {
  try {
    await api.post(ENDPOINTS.logout);
  } catch {
    // token may already be gone/expired — clearing locally is enough
  }
}

/**
 * Permanently deletes the authenticated user's account and personal data
 * (required by App Store guideline 5.1.1(v)). Irreversible. Unlike logout, a
 * failure here must surface — the account still exists — so the caller can keep
 * the user signed in and show the error.
 */
export async function deleteAccountRequest(): Promise<void> {
  try {
    await api.delete(ENDPOINTS.deleteAccount);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, 'Could not delete your account. Please try again.'));
  }
}
