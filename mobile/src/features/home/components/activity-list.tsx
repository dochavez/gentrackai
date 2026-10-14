import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Font, Palette } from '@/constants/design';

export type ActivityItem = {
  id: string;
  emoji: string;
  text: string;
  time: string;
  tint: string;
};

function ActivityRow({ item, isLast }: { item: ActivityItem; isLast: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <View style={[styles.emojiTile, { backgroundColor: item.tint }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{item.text}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );
}

/** Recent fleet activity feed. */
export function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <Card style={styles.card}>
      {items.map((item, i) => (
        <ActivityRow key={item.id} item={item} isLast={i === items.length - 1} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorder,
  },
  emojiTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 15,
  },
  text: {
    flex: 1,
  },
  title: {
    fontFamily: Font.semibold,
    fontSize: 13.5,
    color: Palette.ink,
  },
  time: {
    marginTop: 1,
    fontFamily: Font.regular,
    fontSize: 11.5,
    color: Palette.textFaint,
  },
});
