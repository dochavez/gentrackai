import { useState } from 'react';

import { useReport } from '@/features/maintenance/hooks/use-report';
import { shareMaintenanceReport } from '@/features/maintenance/share-report';
import type { ReportPeriod } from '@/features/maintenance/types';

/**
 * Owns the report screen's state: the selected period (wrapping the `useReport`
 * data hook) and the share lifecycle. Keeps `MaintenanceReportScreen`
 * presentational.
 */
export function useReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('6mo');
  const { report, isLoading } = useReport(period);

  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const share = async () => {
    setShareError(null);
    setSharing(true);
    try {
      await shareMaintenanceReport(period);
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'Could not share the report.');
    } finally {
      setSharing(false);
    }
  };

  return {
    period,
    setPeriod,
    report,
    isLoading,
    sharing,
    shareError,
    share,
  };
}
