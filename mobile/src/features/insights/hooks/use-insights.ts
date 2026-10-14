import { useState } from 'react';
import useSWR from 'swr';

import type { InsightsResponse } from '@/features/insights/types';
import { INSIGHTS_KEY, refreshInsights } from '@/services/api/insights';

/**
 * Fleet insights: always-fresh deterministic analytics + the cached AI
 * recommendation (SWR). `requestRefresh` triggers a server-side regeneration
 * (queued) and revalidates; `refresh` is the plain revalidate used by
 * pull-to-refresh and focus-refetch.
 */
export function useInsights() {
  const { data, isLoading, mutate } = useSWR<InsightsResponse>(INSIGHTS_KEY);
  const [refreshingAi, setRefreshingAi] = useState(false);

  const requestRefresh = async () => {
    setRefreshingAi(true);
    try {
      await refreshInsights();
      await mutate();
    } catch {
      // best effort — rate-limited or offline
    } finally {
      setRefreshingAi(false);
    }
  };

  return {
    analytics: data?.analytics,
    ai: data?.ai ?? null,
    aiPending: data?.aiPending ?? false,
    isLoading,
    refresh: mutate,
    requestRefresh,
    refreshingAi,
  };
}
