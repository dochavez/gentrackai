import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Font, Palette, Radius } from '@/constants/design';

type Props = {
  busy: boolean;
  onSubmit: (rating: number, comment: string | null) => void;
};

/** Star rating + optional comment for a completed job. */
export function ReviewForm({ busy, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Leave a review</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            hitSlop={6}
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}>
            <Text style={[styles.star, n <= rating && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        placeholder="How did it go? (optional)"
        placeholderTextColor={Palette.placeholder}
        value={comment}
        onChangeText={setComment}
        multiline
        style={styles.input}
      />
      <Button
        label="Submit review"
        onPress={() => onSubmit(rating, comment.trim() || null)}
        loading={busy}
        disabled={rating < 1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  stars: { flexDirection: 'row', gap: 6 },
  star: { fontSize: 32, color: Palette.border },
  starOn: { color: Palette.gold },
  input: {
    minHeight: 72,
    borderRadius: Radius.input,
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: Palette.white,
    padding: 12,
    fontSize: 15,
    fontFamily: Font.regular,
    color: Palette.ink,
    textAlignVertical: 'top',
  },
});
