/** Preset first-message chips shown on the empty state. */
export const SUGGESTED_PROMPTS = [
  'What needs service right now?',
  'Why is my generator flagged?',
  'How often should I change the oil?',
];

/** Personalized greeting shown before the first message. */
export function greeting(firstName: string | null): string {
  const who = firstName ? ` ${firstName}` : '';
  return (
    `Hi${who} 👋 I'm your GenTrack assistant. Ask me anything about your generators — ` +
    'what needs service, specs, troubleshooting, or how to keep them healthy.'
  );
}
