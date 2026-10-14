import { useState } from 'react';
import useSWR from 'swr';

import type { ChatMessage } from '@/features/chat/types';
import { CHAT_KEY, clearChat, sendChatMessage } from '@/services/api/chat';
import type { ImageFile } from '@/services/api/upload';

/**
 * Assistant conversation: loads history (SWR) and sends messages — text, a
 * photo, or both — with an optimistic user bubble + typing indicator. On
 * success it revalidates the server history (which now holds both turns) and
 * clears the optimistic copy. `clear` wipes the conversation ("New chat").
 */
export function useChat() {
  const { data, isLoading, mutate } = useSWR<{ messages: ChatMessage[] }>(CHAT_KEY);
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = data?.messages ?? [];
  const messages = [...history, ...pending];

  const send = async (text: string, image?: ImageFile) => {
    const trimmed = text.trim();
    if ((!trimmed && !image) || sending) return;

    setError(null);
    setPending([
      { id: `local-${Date.now()}`, role: 'user', content: trimmed, imageUrl: image?.uri ?? null, timeAgo: null },
    ]);
    setSending(true);
    try {
      await sendChatMessage(trimmed, image);
      await mutate();
      setPending([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setPending([]);
    } finally {
      setSending(false);
    }
  };

  const clear = async () => {
    if (clearing || messages.length === 0) return;
    setError(null);
    setClearing(true);
    try {
      await clearChat();
      setPending([]);
      await mutate({ messages: [] }, { revalidate: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setClearing(false);
    }
  };

  return {
    messages,
    isEmpty: messages.length === 0,
    isLoading,
    sending,
    clearing,
    error,
    send,
    clear,
  };
}
