/** Web fallback for the auth token store (localStorage — no SecureStore on web). */

const KEY = 'gentrack.auth.token';

export async function getToken(): Promise<string | null> {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // ignore (private mode / SSR)
  }
}

export async function clearToken(): Promise<void> {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
