/**
 * Technician view of a feed request — details + make/withdraw an offer.
 * View-only; data from `useTechnicianRequest`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';
import { useTechnicianRequest } from '@/features/technician/hooks/use-technician-requests';

export function TechnicianRequestDetailScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { request, isLoading } = useTechnicianRequest(id);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Request</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading || !request ? (
        <View style={styles.center}>
          {isLoading ? <ActivityIndicator color={Palette.gold} /> : <Text style={styles.muted}>Not found.</Text>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}>
          <Text style={styles.name}>{request.generatorLabel ?? 'Generator maintenance'}</Text>
          <Text style={styles.meta}>
            {request.state}
            {request.customerName ? ` · ${request.customerName}` : ''}
            {request.createdAgo ? ` · ${request.createdAgo}` : ''}
          </Text>

          {request.detail ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>What needs servicing</Text>
              <Text style={styles.detail}>{request.detail}</Text>
            </View>
          ) : null}

          {request.hasMyOffer ? (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Your offer</Text>
              <Text style={styles.offerPrice}>{request.myOfferPriceLabel}</Text>
              <Text style={styles.muted}>Waiting for the customer to choose.</Text>
            </View>
          ) : null}

          {request.canOffer ? (
            <Button
              label={request.hasMyOffer ? 'Update your offer' : 'Make an offer'}
              onPress={() =>
                router.push({ pathname: '/submit-offer', params: { requestId: request.id } })
              }
            />
          ) : (
            <Text style={styles.muted}>This request is no longer open for offers.</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: { fontFamily: Font.displayBold, fontSize: 17, color: Palette.ink },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 14 },
  name: { fontFamily: Font.displayExtra, fontSize: 22, color: Palette.ink },
  meta: { marginTop: -8, fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  card: {
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  cardLabel: {
    fontFamily: Font.bold,
    fontSize: 12.5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: Palette.textMuted,
  },
  detail: { fontFamily: Font.regular, fontSize: 14.5, color: Palette.textStrong, lineHeight: 20 },
  offerPrice: { fontFamily: Font.extrabold, fontSize: 22, color: Palette.ink },
  muted: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
});
