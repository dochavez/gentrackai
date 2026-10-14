import { StyleSheet, Text, View } from 'react-native';

import { Font, Palette } from '@/constants/design';
import type { ReportService } from '@/features/maintenance/types';

/** One completed service in the report list (date · title/generator · cost). */
export function ServiceRow({ service, first }: { service: ReportService; first: boolean }) {
  return (
    <View style={[styles.serviceRow, !first && styles.serviceDivider]}>
      <Text style={styles.serviceDate}>{service.dateLabel}</Text>
      <View style={styles.serviceBody}>
        <Text style={styles.serviceTitle}>{service.title}</Text>
        {service.generatorName ? <Text style={styles.serviceGen}>{service.generatorName}</Text> : null}
      </View>
      <Text style={styles.serviceCost}>{service.costLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  serviceDivider: { borderTopWidth: 1, borderTopColor: Palette.hairline },
  serviceDate: { width: 48, fontFamily: Font.semibold, fontSize: 12.5, color: Palette.textMuted },
  serviceBody: { flex: 1 },
  serviceTitle: { fontFamily: Font.bold, fontSize: 14.5, color: Palette.ink },
  serviceGen: { marginTop: 1, fontFamily: Font.regular, fontSize: 12.5, color: Palette.textMuted },
  serviceCost: { fontFamily: Font.bold, fontSize: 14.5, color: Palette.ink },
});
