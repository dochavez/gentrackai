import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import type { MaintenanceRequest } from '@/features/maintenance-requests/types';

/** Summary of a request's current state (status, provider, schedule, price). */
export function RequestStatusCard({ request }: { request: MaintenanceRequest }) {
  return (
    <View style={styles.card}>
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{request.statusLabel}</Text>
      </View>

      {request.generatorLabel ? (
        <Row label="Generator" value={request.generatorLabel} />
      ) : null}
      {request.providerName ? <Row label="Technician" value={request.providerName} /> : null}
      {request.assignedTechnicianName ? (
        <Row label="Assigned to" value={request.assignedTechnicianName} />
      ) : null}
      {request.acceptedPriceLabel ? <Row label="Agreed price" value={request.acceptedPriceLabel} /> : null}
      {request.scheduleLabel ? <Row label="Scheduled" value={request.scheduleLabel} /> : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
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
    gap: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: Palette.goldWash,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: { fontFamily: Font.bold, fontSize: 12.5, color: Palette.planText },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { fontFamily: Font.regular, fontSize: 13.5, color: Palette.textMuted },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: Font.semibold, fontSize: 14, color: Palette.ink },
});
