import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import { SUGGESTED_PROMPTS } from '@/features/chat/constants';

/** Tappable preset first-messages shown on the empty state. */
export function SuggestedPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <View style={styles.wrap}>
      {SUGGESTED_PROMPTS.map((prompt) => (
        <Pressable
          key={prompt}
          onPress={() => onSelect(prompt)}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          accessibilityRole="button">
          <Text style={styles.text}>{prompt}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, alignItems: 'flex-start' },
  chip: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  pressed: { opacity: 0.85 },
  text: { fontFamily: Font.semibold, fontSize: 13.5, color: Palette.textStrong },
});
