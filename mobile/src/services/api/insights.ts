import { api, getApiErrorMessage } from '@/services/api/client';

/** SWR key for the fleet insights (analytics + cached AI recommendation). */
export const INSIGHTS_KEY = '/insights';

/**
 * Ask the backend to regenerate the AI recommendation now (rate-limited). It's
 * queued server-side — the fresh payload arrives on a later revalidation.
 */
export async function refreshInsights(): Promise<void> {
  try {
    await api.post('/insights/refresh');
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't refresh insights. Try again shortly."));
  }
}
