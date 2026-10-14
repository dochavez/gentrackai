/**
 * Fleet — the list of the user's registered generators. Search and filter chips
 * are presentational for now; tapping a card opens its detail, and the + button
 * starts the scan flow.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlusIcon } from '@/components/ui/icons/plus-icon';
import { SearchIcon } from '@/components/ui/icons/search-icon';
import { Font, Palette } from '@/constants/design';
import { IS_TABLET } from '@/constants/dimensions';
import { GeneratorCard } from '@/features/generators/components/generator-card';
import { useGenerators } from '@/features/generators/hooks/use-generators';

export function FleetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { generators, isLoading } = useGenerators();

  const needsCare = generators.filter((g) => g.status === 'needs_care').length;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Generators</Text>
          <Pressable
            onPress={() => router.push('/scan')}
            style={styles.addButton}
            accessibilityLabel="Scan a generator">
            <PlusIcon size={22} color={Palette.ink} />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <SearchIcon size={18} />
          <Text style={styles.searchPlaceholder}>Search by model, location…</Text>
        </View>

        <View style={styles.chips}>
          <View style={[styles.chip, styles.chipActive]}>
            <Text style={styles.chipActiveText}>All {generators.length}</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Running</Text>
          </View>
          {needsCare > 0 ? (
            <View style={[styles.chip, styles.chipAlert]}>
              <Text style={styles.chipAlertText}>Needs care {needsCare}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={Palette.gold} />
        </View>
      ) : generators.length === 0 ? (
        <View style={styles.centerFill}>
          <Text style={styles.emptyTitle}>No generators yet</Text>
          <Text style={styles.emptyText}>Scan a label to add your first generator.</Text>
          <Pressable onPress={() => router.push('/scan')} style={styles.emptyCta}>
            <PlusIcon size={18} color={Palette.ink} />
            <Text style={styles.emptyCtaText}>Scan a generator</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            IS_TABLET ? styles.grid : styles.list,
            { paddingBottom: insets.bottom + 112 },
          ]}
          showsVerticalScrollIndicator={false}>
          {generators.map((generator) => (
            <View key={generator.id} style={IS_TABLET ? styles.gridItem : undefined}>
              <GeneratorCard
                generator={generator}
                onPress={() => router.push({ pathname: '/generators/[id]', params: { id: generator.id } })}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: wp(IS_TABLET ? 12 : 5),
    paddingBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Font.displayExtra,
    fontSize: 28,
    color: Palette.ink,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: Palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginTop: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  searchPlaceholder: {
    fontFamily: Font.regular,
    fontSize: 14.5,
    color: Palette.textFaint,
  },
  chips: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.hairline,
  },
  chipText: {
    fontFamily: Font.semibold,
    fontSize: 12.5,
    color: Palette.textStrong,
  },
  chipActive: {
    backgroundColor: Palette.ink,
    borderColor: Palette.ink,
  },
  chipActiveText: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: Palette.white,
  },
  chipAlert: {
    backgroundColor: Palette.redBg,
    borderColor: Palette.redBg,
  },
  chipAlertText: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    color: Palette.red,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
    gap: 6,
  },
  emptyTitle: {
    fontFamily: Font.displayBold,
    fontSize: 18,
    color: Palette.ink,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: Font.regular,
    fontSize: 14,
    color: Palette.textMuted,
  },
  emptyCta: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Palette.gold,
  },
  emptyCtaText: {
    fontFamily: Font.extrabold,
    fontSize: 15,
    color: Palette.ink,
  },
  list: {
    paddingHorizontal: wp(IS_TABLET ? 12 : 5),
    paddingTop: 8,
    gap: 12,
  },
  grid: {
    paddingHorizontal: wp(IS_TABLET ? 12 : 5),
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48.5%',
  },
});
