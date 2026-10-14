import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon } from '@/components/ui/icons/chevron-right-icon';
import { Font, Palette } from '@/constants/design';
import type { TechnicianRequest } from '@/features/technician/types';

/** A row in the technician feed or jobs list. */
export function TechnicianRequestRow({
  request,
  onPress,
}: {
  request: TechnicianRequest;
  onPress: () => void;
}) {
  const trailing =
    request.myOfferPriceLabel ?? request.acceptedPriceLabel ?? null;

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityLabel={request.generatorLabel ?? 'Request'}>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {request.generatorLabel ?? 'Generator maintenance'}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {request.state}
          {request.customerName ? ` · ${request.customerName}` : ''}
          {request.createdAgo ? ` · ${request.createdAgo}` : ''}
        </Text>
        <View style={styles.pillRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{request.statusLabel}</Text>
          </View>
          {request.hasMyOffer && request.status === 'open' ? (
            <Text style={styles.tag}>Your offer sent</Text>
          ) : null}
        </View>
      </View>
      {trailing ? <Text style={styles.price}>{trailing}</Text> : null}
      <ChevronRightIcon size={18} color={Palette.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Palette.white,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    padding: 14,
  },
  body: { flex: 1, gap: 4 },
  name: { fontFamily: Font.bold, fontSize: 15, color: Palette.ink },
  meta: { fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldWash,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontFamily: Font.bold, fontSize: 11.5, color: Palette.planText },
  tag: { fontFamily: Font.medium, fontSize: 11.5, color: Palette.textSubtle },
  price: { fontFamily: Font.extrabold, fontSize: 16, color: Palette.ink },
});
