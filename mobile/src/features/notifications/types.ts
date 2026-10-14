export type NotificationType = 'task' | 'maintenance' | 'system';

/** Matches the backend NotificationResource. */
export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /** In-app deep-link target to open when tapped (or null). */
  link: string | null;
  icon: string;
  unread: boolean;
  timeAgo: string | null;
};
