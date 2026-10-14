/**
 * Web fallback: fetch the report PDF (with the auth token) as a blob and
 * trigger a browser download. The native share sheet isn't available on web.
 */

import { env } from '@/config/env';
import type { ReportPeriod } from '@/features/maintenance/types';
import { reportPdfPath } from '@/services/api/maintenance';
import { getToken } from '@/services/auth/token-store';

export async function shareMaintenanceReport(period: ReportPeriod): Promise<void> {
  const token = await getToken();
  const url = `${env.api.baseUrl}/api${reportPdfPath(period)}`;

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error('Could not generate the report.');

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = 'maintenance-report.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
