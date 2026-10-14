import { api, getApiErrorMessage } from '@/services/api/client';

export const NOTIFICATIONS_KEY = '/notifications';

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await api.patch(`${NOTIFICATIONS_KEY}/${id}`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await api.post(`${NOTIFICATIONS_KEY}/read`);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
