/**
 * Request detail — status, incoming offers (accept one), scheduling, and the
 * review flow. View-only; logic in `useMaintenanceRequest`.
 */

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon } from '@/components/ui/icons/chevron-left-icon';
import { Font, Palette } from '@/constants/design';
import { OfferRow } from '@/features/maintenance-requests/components/offer-row';
import { RequestStatusCard } from '@/features/maintenance-requests/components/request-status-card';
import { ReviewForm } from '@/features/maintenance-requests/components/review-form';
import { useMaintenanceRequest } from '@/features/maintenance-requests/hooks/use-maintenance-request';
import { useRefreshControl } from '@/hooks/use-refresh-control';
import { useRefreshOnFocus } from '@/hooks/use-refresh-on-focus';

export function RequestDetailScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { request, isLoading, busy, error, accept, cancel, review, refresh } = useMaintenanceRequest(id);
  // Offers arrive asynchronously — refetch on focus and pull-down so they appear.
  useRefreshOnFocus(refresh);
  const { refreshing, onRefresh } = useRefreshControl(refresh);

  const confirmAccept = (offerId: string, providerName: string | null) =>
    Alert.alert('Accept this offer?', `${providerName ?? 'This technician'} will be assigned the job.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => accept(offerId) },
    ]);

  const confirmCancel = () =>
    Alert.alert('Cancel request?', 'This withdraws your request and any offers.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => cancel() },
    ]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <ChevronLeftIcon size={18} color={Palette.ink} />
        </Pressable>
        <Text style={styles.title}>Maintenance request</Text>
        <View style={styles.iconBtn} />
      </View>

      {isLoading || !request ? (
        <View style={styles.center}>
          {isLoading ? (
            <ActivityIndicator color={Palette.gold} />
          ) : (
            <Text style={styles.muted}>Request not found.</Text>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Palette.gold}
              colors={[Palette.gold]}
            />
          }>
          <RequestStatusCard request={request} />

          {request.detail ? <Text style={styles.detail}>{request.detail}</Text> : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {request.status === 'open' ? (
            <>
              <Text style={styles.section}>
                Offers {request.offersCount > 0 ? `(${request.offersCount})` : ''}
              </Text>
              {request.offers && request.offers.length > 0 ? (
                request.offers.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    acceptable
                    accepting={busy}
                    onAccept={() => confirmAccept(offer.id, offer.providerName)}
                    onViewProvider={
                      offer.providerId ? () => router.push(`/providers/${offer.providerId}`) : undefined
                    }
                  />
                ))
              ) : (
                <Text style={styles.muted}>No offers yet — technicians in your area will respond soon.</Text>
              )}
            </>
          ) : null}

          {request.review ? (
            <View style={styles.reviewCard}>
              <Text style={styles.section}>Your review</Text>
              <Text style={styles.reviewStars}>{'★'.repeat(request.review.rating)}</Text>
              {request.review.comment ? (
                <Text style={styles.detail}>{request.review.comment}</Text>
              ) : null}
            </View>
          ) : request.canReview ? (
            <ReviewForm busy={busy} onSubmit={(rating, comment) => review(rating, comment)} />
          ) : null}

          {request.canCancel ? (
            <Pressable style={styles.cancel} onPress={confirmCancel} disabled={busy}>
              <Text style={styles.cancelText}>Cancel request</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.cream },
  flex: { flex: 1 },
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
  detail: { fontFamily: Font.regular, fontSize: 14, color: Palette.textStrong, lineHeight: 20 },
  section: { marginTop: 4, fontFamily: Font.displayBold, fontSize: 16, color: Palette.ink },
  muted: { fontFamily: Font.regular, fontSize: 14, color: Palette.textMuted },
  error: { fontFamily: Font.medium, fontSize: 13.5, color: Palette.red },
  reviewCard: { gap: 6 },
  reviewStars: { fontSize: 20, color: Palette.gold },
  cancel: { marginTop: 8, height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: Font.bold, fontSize: 14, color: Palette.red, textDecorationLine: 'underline' },
});
