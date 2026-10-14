import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { WrenchIcon } from '@/components/ui/icons/wrench-icon';
import { Font, Palette } from '@/constants/design';

/** The next scheduled maintenance item. */
export function NextUpCard({
  title,
  subtitle,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  badge: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.card}>
        <View style={styles.iconTile}>
          <WrenchIcon size={22} color={Palette.goldText} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Badge label={badge} color={Palette.red} backgroundColor={Palette.redBg} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Palette.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 15,
    color: Palette.ink,
  },
  subtitle: {
    marginTop: 1,
    fontFamily: Font.regular,
    fontSize: 12.5,
    color: Palette.textMuted,
  },
});
