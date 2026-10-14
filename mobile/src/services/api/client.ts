/**
 * Axios instance for the GenTrack backend (Laravel). Base URL comes from
 * `env.api.baseUrl` with `/api` appended. A request interceptor attaches the
 * stored bearer token; `getApiErrorMessage` normalizes Laravel error payloads.
 */

import axios from 'axios';

import { env } from '@/config/env';
import { getToken } from '@/services/auth/token-store';

export const api = axios.create({
  baseURL: `${env.api.baseUrl}/api`,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type LaravelError = {
  message?: string;
  errors?: Record<string, string[]>;
};

/** Turns an axios/network error into a user-facing message. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Network error — please check your connection.';
    const data = error.response.data as LaravelError | undefined;
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    return firstFieldError ?? data?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
