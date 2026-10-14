import useSWR from 'swr';

import type { AppNotification } from '@/features/notifications/types';
import {
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_KEY,
} from '@/services/api/notifications';

/**
 * Owns notification data and the read mutations. Returns presentation-ready data
 * plus `read`/`readAll` handlers so screens stay view-only. Also consumed by the
 * home screen for `unreadCount` — keep the existing fields stable.
 */
export function useNotifications() {
  const { data, isLoading, mutate } = useSWR<{ notifications: AppNotification[]; unreadCount: number }>(
    NOTIFICATIONS_KEY
  );

  /** Mark a single notification read; no-op if already read. Best effort. */
  const read = async (item: AppNotification) => {
    if (!item.unread) return;
    try {
      await markNotificationRead(item.id);
      await mutate();
    } catch {
      // best effort
    }
  };

  /** Clear the unread state across all notifications. Best effort. */
  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      await mutate();
    } catch {
      // best effort
    }
  };

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    refresh: mutate,
    read,
    readAll,
  };
}
