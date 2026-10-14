import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';

/** Tappable label-photo field: shows the current/selected photo or an "add photo" prompt. */
export function PhotoField({ uri, onPress }: { uri: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.photo} accessibilityLabel="Change photo">
      {uri ? (
        <Image source={{ uri }} style={styles.photoImg} resizeMode="cover" />
      ) : (
        <Text style={styles.photoText}>Add a label photo</Text>
      )}
      <View style={styles.photoBadge}>
        <Text style={styles.photoBadgeText}>{uri ? 'Change photo' : 'Add photo'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  photo: {
    height: 150,
    borderRadius: 16,
    backgroundColor: Palette.goldWash,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  photoText: { fontFamily: Font.semibold, fontSize: 14, color: Palette.goldText },
  photoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(27,23,18,0.82)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  photoBadgeText: { fontFamily: Font.bold, fontSize: 12, color: Palette.white },
});
