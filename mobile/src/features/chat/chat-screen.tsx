/**
 * GenTrack AI chat — a fleet-aware assistant. The app posts a message to the
 * backend, which answers via Gemini using user-scoped tools (tool calling); the
 * app never calls Gemini itself. State/data wiring lives in `useChat`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { EditIcon } from '@/components/ui/icons/edit-icon';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { AssistantAvatar } from '@/features/chat/components/assistant-avatar';
import { ChatInput } from '@/features/chat/components/chat-input';
import { MessageBubble } from '@/features/chat/components/message-bubble';
import { SuggestedPrompts } from '@/features/chat/components/suggested-prompts';
import { greeting } from '@/features/chat/constants';
import { useChat } from '@/features/chat/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';

export function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { messages, isEmpty, sending, clearing, error, send, clear } = useChat();
  const scrollRef = useRef<ScrollView>(null);

  const confirmNewChat = () => {
    Alert.alert('New chat', 'This clears your current conversation. Start a new one?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New chat', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <AssistantAvatar size={40} />
        <View style={styles.headerText}>
          <Text style={styles.title}>GenTrack AI</Text>
          <View style={styles.statusRow}>
            <View style={styles.dot} />
            <Text style={styles.status}>Knows your fleet</Text>
          </View>
        </View>
        {!isEmpty ? (
          <Pressable
            onPress={confirmNewChat}
            disabled={clearing}
            style={[styles.iconBtn, clearing && styles.iconBtnBusy]}
            accessibilityLabel="New chat">
            {clearing ? (
              <ActivityIndicator size="small" color={Palette.ink} />
            ) : (
              <EditIcon size={18} color={Palette.ink} />
            )}
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={insets.top + 56}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {isEmpty ? (
            <View style={styles.empty}>
              <MessageBubble
                message={{
                  id: 'greeting',
                  role: 'assistant',
                  content: greeting(user?.firstName ?? null),
                  imageUrl: null,
                  timeAgo: null,
                }}
              />
              <View style={styles.prompts}>
                <SuggestedPrompts onSelect={send} />
              </View>
            </View>
          ) : (
            <View style={styles.messages}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {sending ? (
                <View style={styles.typingRow}>
                  <AssistantAvatar size={30} />
                  <View style={styles.typingBubble}>
                    <ActivityIndicator color={Palette.gold} size="small" />
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={{ paddingBottom: insets.bottom + 8 }}>
          <ChatInput onSend={send} disabled={sending} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: wp(IS_TABLET ? 10 : 5),
    paddingBottom: 12,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnBusy: { opacity: 0.6 },
  headerText: { flex: 1 },
  title: { fontFamily: Font.displayBold, fontSize: 18, color: Palette.ink },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: Palette.green },
  status: { fontFamily: Font.semibold, fontSize: 12.5, color: Palette.green },
  content: { paddingHorizontal: wp(IS_TABLET ? 10 : 5), paddingTop: 8, paddingBottom: 16, flexGrow: 1 },
  empty: { gap: 16 },
  prompts: { paddingLeft: 38 },
  messages: { gap: 14 },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  typingBubble: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  error: { marginTop: 12, fontFamily: Font.medium, fontSize: 13, color: Palette.red, textAlign: 'center' },
});
