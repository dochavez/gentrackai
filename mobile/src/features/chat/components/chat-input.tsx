import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { CloseIcon } from '@/components/ui/icons/close-icon';
import { ImageIcon } from '@/components/ui/icons/image-icon';
import { SendIcon } from '@/components/ui/icons/send-icon';
import { Font, Palette, Radius } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { captureChatPhoto, pickChatPhotoFromLibrary } from '@/features/chat/pick-image';
import type { ImageFile } from '@/services/api/upload';

/** Message composer — multiline input, a photo attach button, and a gold send button. */
export function ChatInput({
  onSend,
  disabled = false,
}: {
  onSend: (text: string, image?: ImageFile) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState('');
  const [image, setImage] = useState<ImageFile | null>(null);
  const canSend = (text.trim().length > 0 || image != null) && !disabled;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim(), image ?? undefined);
    setText('');
    setImage(null);
  };

  const attach = () => {
    Alert.alert('Add a photo', 'Share a photo of the generator, controller or a fault code.', [
      { text: 'Take Photo', onPress: async () => setImage((await captureChatPhoto()) ?? null) },
      { text: 'Choose from Library', onPress: async () => setImage((await pickChatPhotoFromLibrary()) ?? null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View>
      {image ? (
        <View style={styles.previewRow}>
          <View style={styles.preview}>
            <Image source={{ uri: image.uri }} style={styles.previewImage} />
            <Pressable
              onPress={() => setImage(null)}
              hitSlop={8}
              style={styles.previewRemove}
              accessibilityLabel="Remove photo">
              <CloseIcon size={13} color={Palette.white} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          onPress={attach}
          disabled={disabled}
          style={[styles.attach, disabled && styles.disabled]}
          accessibilityLabel="Attach a photo">
          <ImageIcon size={22} color={Palette.textStrong} />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask about your generators…"
          placeholderTextColor={Palette.placeholder}
          style={styles.input}
          multiline
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={submit}
        />
        <Pressable
          onPress={submit}
          disabled={!canSend}
          style={[styles.send, !canSend && styles.disabled]}
          accessibilityLabel="Send message">
          <SendIcon size={19} color={Palette.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: wp(IS_TABLET ? 10 : 5), paddingTop: 8 },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    paddingHorizontal: 15,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    fontFamily: Font.regular,
    color: Palette.ink,
  },
  attach: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  previewRow: { paddingHorizontal: wp(IS_TABLET ? 10 : 5), paddingTop: 8 },
  preview: { width: 72, height: 72 },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  previewRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Palette.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
