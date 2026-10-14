import { Image, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import { AssistantAvatar } from '@/features/chat/components/assistant-avatar';
import { MarkdownMessage } from '@/features/chat/components/markdown-message';
import type { ChatMessage } from '@/features/chat/types';

/** A single chat turn — assistant on the left (with avatar), user on the right. */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    const hasText = message.content.trim().length > 0;
    return (
      <View style={styles.userRow}>
        {message.imageUrl ? (
          <Image source={{ uri: message.imageUrl }} style={styles.userImage} resizeMode="cover" />
        ) : null}
        {hasText ? (
          <View style={[styles.bubble, styles.userBubble]}>
            <Text style={styles.userText}>{message.content}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.assistantRow}>
      <AssistantAvatar size={30} />
      <View style={[styles.bubble, styles.assistantBubble]}>
        <MarkdownMessage content={message.content} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end', gap: 6 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 11 },
  userBubble: { backgroundColor: Palette.ink, borderBottomRightRadius: 6 },
  userImage: {
    width: 200,
    maxWidth: '82%',
    height: 200,
    borderRadius: 16,
    borderBottomRightRadius: 6,
    backgroundColor: Palette.goldWash,
  },
  userText: { fontFamily: Font.medium, fontSize: 14.5, lineHeight: 20, color: Palette.white },
  assistantBubble: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderBottomLeftRadius: 6,
  },
});
