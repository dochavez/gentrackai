/**
 * Downloads the backend-generated report PDF (with the auth token) to a cache
 * file and opens the native share sheet (WhatsApp, Mail, etc.). Native only —
 * see share-report.web.ts for the web fallback.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { env } from '@/config/env';
import type { ReportPeriod } from '@/features/maintenance/types';
import { reportPdfPath } from '@/services/api/maintenance';
import { getToken } from '@/services/auth/token-store';

export async function shareMaintenanceReport(period: ReportPeriod): Promise<void> {
  const token = await getToken();
  const url = `${env.api.baseUrl}/api${reportPdfPath(period)}`;
  const target = `${FileSystem.cacheDirectory}maintenance-report.pdf`;

  const { uri } = await FileSystem.downloadAsync(url, target, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share maintenance report',
      UTI: 'com.adobe.pdf',
    });
  }
}
