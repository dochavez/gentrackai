import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Revalidates data when the screen regains focus (e.g. switching back to a tab
 * or returning from a modal). The initial focus on mount is skipped, since SWR
 * already fetches then — this only re-fetches on *subsequent* focuses.
 */
export function useRefreshOnFocus(refresh: () => void | Promise<unknown>) {
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );
}
