import { useCallback, useState } from 'react';

/**
 * Drives a pull-to-refresh spinner around an async refresh (e.g. SWR `mutate`).
 * Returns `{ refreshing, onRefresh }` to spread into a `<RefreshControl>`.
 */
export function useRefreshControl(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return { refreshing, onRefresh };
}
