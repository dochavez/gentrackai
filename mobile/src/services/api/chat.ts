import type { ChatMessage } from '@/features/chat/types';
import { api, getApiErrorMessage } from '@/services/api/client';
import { appendImage, MULTIPART, type ImageFile } from '@/services/api/upload';

/** SWR key for the assistant conversation history. */
export const CHAT_KEY = '/chat';

/** Tool-calling (and now optional vision) can take several model round-trips. */
const CHAT_TIMEOUT_MS = 45_000;

/**
 * Send a message and/or a photo; returns the assistant's grounded reply. With a
 * photo we post multipart (the backend passes it to Gemini for identification);
 * otherwise a plain JSON post.
 */
export async function sendChatMessage(message: string, image?: ImageFile): Promise<ChatMessage> {
  try {
    if (image) {
      const form = new FormData();
      if (message) form.append('message', message);
      appendImage(form, image);
      const { data } = await api.post<{ message: ChatMessage }>(CHAT_KEY, form, {
        ...MULTIPART,
        timeout: CHAT_TIMEOUT_MS,
      });
      return data.message;
    }
    const { data } = await api.post<{ message: ChatMessage }>(CHAT_KEY, { message }, { timeout: CHAT_TIMEOUT_MS });
    return data.message;
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't reach the assistant. Please try again."));
  }
}

/** Clears the conversation — backs the app's "New chat" action. */
export async function clearChat(): Promise<void> {
  try {
    await api.delete(CHAT_KEY);
  } catch (e) {
    throw new Error(getApiErrorMessage(e, "Couldn't clear the chat. Please try again."));
  }
}
