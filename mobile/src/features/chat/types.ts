export type ChatRole = 'user' | 'assistant';

/** Matches the backend ChatMessageResource. */
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** URL of a photo attached to a user message, if any (presentation-ready). */
  imageUrl: string | null;
  timeAgo: string | null;
};
